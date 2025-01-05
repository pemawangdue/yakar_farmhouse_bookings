import boto3


class DynamoDB:
    def __init__(self, client: boto3.client):
        self.client = client if client else boto3.client('dynamodb')

    def get_all_items_with_pagination(self, table_name):
        # Define the initial scan parameters
        scan_kwargs = {
            'TableName': table_name,
        }

        # This will store all the items across paginated responses
        all_items = []

        while True:
            # Perform the scan operation to fetch a page of results
            response = self.client.scan(**scan_kwargs)

            # Add the current page of results to the all_items list
            all_items.extend(response['Items'])

            # Check if there is another page of results
            if 'LastEvaluatedKey' in response:
                scan_kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
            else:
                break  # No more pages, exit the loop

        return all_items

    def create_or_update_item(self, table_name, item):
        response = self.client.put_item(
            TableName=table_name,
            Item=item  # Item should be a dictionary with the key-value pairs
        )
        return response

    def update_item(self, table_name, key, update_expression, expression_attribute_values):
        response = self.client.update_item(
            TableName=table_name,
            Key=key,  # e.g., {'PrimaryKey': {'S': 'unique-key'}}
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="UPDATED_NEW"  # This will return the updated values
        )
        return response
    