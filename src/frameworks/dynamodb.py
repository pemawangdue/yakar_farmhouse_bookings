import boto3
from boto3.dynamodb.types import TypeDeserializer, TypeSerializer

def deserializer_dynamo_db_item(item):
     deserializer = TypeDeserializer()
     return {key: deserializer.deserialize(value) for key, value in item.items()}


def serializer_dynamo_db_item(item):
     deserializer = TypeSerializer()
     return {key: deserializer.serialize(value) for key, value in item.items()}

def convert_dynamodb_response_to_json(response):
    if isinstance(response, dict):
        return deserializer_dynamo_db_item(response)
    elif isinstance(response, list):
        json_data = []
        for item in response:
            json_data.extend(deserializer_dynamo_db_item(item))
        return json_data
    raise Exception(f"Invalid input for conversion response={response}, expected data types are [list, dict]")


class DynamoDB:
    def __init__(self, client: boto3.client=None):
        self.client = client if client else boto3.client('dynamodb')

    def get_item(self, table_name: str, values: list, columns: list, consistent_read=False):
        dict_item = dict(zip(columns, values))
        response = self.client.get_item(
            TableName=table_name, 
            Key=serializer_dynamo_db_item(dict_item), 
            ConsistentRead=consistent_read
        )
        return convert_dynamodb_response_to_json(response)

    def put_item(self, table_name: str, values: list, columns: list):
        dict_item = dict(zip(columns, values))
        return self.client.put_item(
            TableName=table_name, 
            Item=serializer_dynamo_db_item(dict_item)
        )
        
    def delete_item(self, table_name: str, values: list, columns: list):
        dict_item = dict(zip(columns, values))
        return self.client.delete_item(
            TableName=table_name, 
            Item=serializer_dynamo_db_item(dict_item)
        )
    
    def update_item(self, table_name: str, keys: list, key_cols: list, 
                    update_expression: dict, expression_attribute_values: dict):
        dict_key = dict(zip(key_cols, keys))
        response = self.client.update_item(
            TableName=table_name,
            Key=dict_key,  # e.g., {'PrimaryKey': {'S': 'unique-key'}}
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="UPDATED_NEW"  # This will return the updated values
        )
        return convert_dynamodb_response_to_json(response)

    def scan_with_filter(self, table_name: str, expression_values, filter_expression):
        result = {"Items": []}
        paginator = self.client.get_paginator("scan")
        page_iterator = paginator.paginate(
            TableName=table_name, FilterExpression=filter_expression, ExpressionValues=expression_values
        )
        for page in page_iterator:
            result["Items"].extend(page.get("Items", []))
        return convert_dynamodb_response_to_json(result)
