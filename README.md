[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/UxpU_KWG)

# CS3219 Assignment 6 G03 - LeetCode Scraper Lambda

This script is designed to scrape LeetCode questions and save them to a MongoDB database. It provides functionalities such as parsing the LeetCode questions sitemap XML file, scraping question details from individual URLs, and saving the scraped data to MongoDB. It is designed to be run as an AWS Lambda function, but can be executed locally. Deployment to AWS is done using Pulumi.

## File Structure

```bash
- infra/ # Pulumi infrastructure as code
    - index.ts # Pulumi program to provision AWS services
    - Pulumi.yaml # Pulumi configuration file
    - Pulumi.sample.yaml # A stack configuration file `sample` used for demo purposes
- app/ # Source code for the Lambda function
    - /layer # Dependencies for the Lambda function
        - packages.zip # Dependencies for the Lambda function
    - /scraper # Source code for the Lambda function
        - handler.py # Lambda function handler
        - requirements.txt # Dependencies for the Lambda function
    - Dockerfile.dev # Dockerfile for local development
    - entrypoint.sh # Entrypoint script for running the program locally
- .env.example # Example environment variables file
- docker-compose.yml # Docker Compose file for local development
```

## Setup

Ensure you have the following installed:

- [Python 3.9+](https://www.python.org/downloads/)
- [MongoDB](https://www.mongodb.com/try/download/community)
- [Docker](https://www.docker.com/products/docker-desktop)

## Environment Variables

The script uses the following environment variables:

- `MONGO_CONNECTION_STRING`: The connection string for the MongoDB server.
- `RATE_LIMIT`: The maximum number of questions to scrape per function invocation. Defaults to 60.
- `COOLDOWN_PERIOD`: The cooldown period (in seconds) to determine which questions need to be re-scraped. Defaults to 10 days.

## Local Testing

For local testing, a `docker-compose.yml` file has been provided. 

It contains a MongoDB container and a container for the script. When the script container is run, it will invoke the `handler` function in `handler.py`. This function will scrape the questions and save them to the MongoDB container `local-questions-db`. The MongoDB container will be exposed on port `27017` on the host machine.

Set the environment variables in a `.env.development` file in the root directory of the project. An example `.env.example` has been provided for you.

To test the script locally, run:

```bash
docker-compose up
```

This will invoke the `handler` function and print the response.

## Deployment to AWS with Pulumi

### AWS Services

Pulumi is used to provision the following AWS services for the Lambda function:

- AWS Lambda: to run the scraper script
- AWS EventBridge: to schedule the Lambda function to run periodically (every 6 hours)
- AWS CloudWatch: to store the logs from the Lambda function
- AWS IAM: to create the necessary roles and permissions for the Lambda function to run
- AWS Lambda Layer: to store the dependencies for the Lambda function

### Pre-requisites

- Ensure you have completed the instructions above to set up the services for local development
- [Install and setup Pulumi](https://www.pulumi.com/docs/clouds/aws/get-started/begin/)

### Instructions

For the purposes of this demo, a sample stack `sample` has been created with the required infrastructure. You are recommended to use this stack for testing.

An online mongodb instance has also been provisioned for you to use for testing. **It will be running until 31st December 2023.**

1. Move to the `infra` directory
2. Ensure you are on the stack you want to test a deploy from (for demo purposes, a sample stack `sample` has been created with the required infrastructure)
   - You can verify this by running `pulumi stack`
   - If you are not on the right stack, run `pulumi stack select sample` to switch to the right stack
3. Run `pulumi up` to preview the changes and then deploy them

