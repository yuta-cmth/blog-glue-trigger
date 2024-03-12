import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as glue from "aws-cdk-lib/aws-glue";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";

export class BlogGlueTriggerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket
    const bucket = new s3.Bucket(this, "MyBucket", {
      bucketName: "my-iot-data-bucket",
    });

    // Attached to the Glue Crawler Role to crawl the S3 bucket
    const crawlerRole = new iam.Role(this, "BlogGlueCrawlerRole", {
      assumedBy: new iam.ServicePrincipal("glue.amazonaws.com"),
      inlinePolicies: {
        glueCrawlerPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["s3:GetObject", "s3:PutObject"],
              resources: [`${bucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    // Create Glue Crawler
    const crawler = new glue.CfnCrawler(this, "BlogGlueCrawler", {
      name: "blog-glue-trigger-crawler",
      role: crawlerRole.roleArn,
      targets: {
        s3Targets: [
          {
            path: `s3://${bucket.bucketName}/sensor_raw_data`,
          },
        ],
      },
    });

    // Create EventBridge Rule
    const rule = new events.Rule(this, "BlogGlueCrawlerSucceededRule", {
      eventPattern: {
        source: ["aws.glue"],
        detailType: ["Glue Crawler State Change"],
        detail: {
          crawlerName: [crawler.name],
          state: ["SUCCEEDED"],
        },
      },
    });

    // Create Lambda function
    const lambdaFunction = new lambda.Function(
      this,
      "BlogGlueCrawlerEventHandler",
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: "main.lambda_handler",
        code: lambda.Code.fromAsset(
          "codes/lambda/blog_glue_crawler_success_handler"
        ),
      }
    );

    // Add EventBridge Rule as a target for Lambda function
    rule.addTarget(new targets.LambdaFunction(lambdaFunction));
  }
}
