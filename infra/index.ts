import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Load Pulumi configuration
const config = new pulumi.Config();

// For Lambda function parameters
const cooldownPeriod = config.getNumber("COOLDOWN_PERIOD") || 60 * 60 * 24 * 10; // 10 Days
const rateLimit = config.getNumber("RATE_LIMIT") || 60;
const mongoConnectionString = config.require("MONGO_CONNECTION_STRING");

// The IAM policy document for lambda
const assumeRole = aws.iam.getPolicyDocument({
  statements: [
    {
      effect: "Allow",
      principals: [
        {
          type: "Service",
          identifiers: ["lambda.amazonaws.com"],
        },
      ],
      actions: ["sts:AssumeRole"],
    },
  ],
});

// Create an IAM role for the Lambda function
const iamForLambda = new aws.iam.Role("iamForLambda", {
  assumeRolePolicy: assumeRole.then((assumeRole) => assumeRole.json),
});

// The IAM policy document for CloudWatch
const cloudwatchPolicyDocument = aws.iam.getPolicyDocument({
  statements: [
    {
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
      ],
      resources: ["arn:aws:logs:*:*:*"],
      effect: "Allow",
    },
  ],
});

// Attach the CloudWatch policy to the role to allow CloudWatch to write logs
new aws.iam.RolePolicy("rolePolicy", {
  role: iamForLambda.id,
  policy: cloudwatchPolicyDocument.then((cloudwatchPolicyDocument) => {
    return cloudwatchPolicyDocument.json;
  }),
});

// Create a Lambda Layer for Python packages
const layer = new aws.lambda.LayerVersion("myLayer", {
  compatibleRuntimes: ["python3.9"],
  code: new pulumi.asset.FileArchive("../app/layer/packages.zip"),
  layerName: "python-packages",
});

// Create an AWS Lambda function
const lambdaFunction = new aws.lambda.Function("mylambda", {
  role: iamForLambda.arn,
  runtime: "python3.9",
  handler: "handler.handler",
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("../app/scraper"),
  }),
  layers: [layer.arn],
  memorySize: 256,
  timeout: 300,
  environment: {
    variables: {
      MONGO_CONNECTION_STRING: mongoConnectionString,
      RATE_LIMIT: `${rateLimit}`,
      COOLDOWN_PERIOD: `${cooldownPeriod}`,
    },
  },
});

// Create a rule to execute qid (4 times a day)
const qidRule = new aws.cloudwatch.EventRule("qidRule", {
  scheduleExpression: "rate(6 hours)",
});

// Connect the rule to the lambda function
const qidEventRule = new aws.cloudwatch.EventTarget("qidTarget", {
  rule: qidRule.name,
  arn: lambdaFunction.arn,
  input: JSON.stringify({
    message: `Triggered from Schedule`,
  }),
});

// Allow EventBridge to call the Lambda function
new aws.lambda.Permission("permission", {
  action: "lambda:InvokeFunction",
  function: lambdaFunction.name,
  principal: "events.amazonaws.com",
  sourceArn: qidRule.arn,
});

// Export the Lambda function ARN and the Cloudwatch Event Rule ARN
export const myLambdaFunctionArn = lambdaFunction.arn;
export const myCloudwatchEventRuleArn = qidEventRule.arn;
export const mongo = mongoConnectionString;
