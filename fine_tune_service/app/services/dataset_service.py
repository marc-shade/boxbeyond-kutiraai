# app/services/dataset_service.py
import json
import os
from typing import List, Dict, Tuple
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text

class DatasetService:
    def __init__(self, database_url: str):
        """
        Initialize DatasetService with database connection
        
        Args:
            database_url: Database connection string (e.g., postgresql://user:pass@localhost/dbname)
        """
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def get_all_dataset_jsonl(self, dataset_id: str) -> List[Dict]:
        """
        Fetch all JSONL records for a given dataset ID from the database
        
        Args:
            dataset_id: The ID of the dataset to fetch
            
        Returns:
            List of dictionaries containing the JSONL data
        """
        try:
            with self.SessionLocal() as session:
                # Adjust the query based on your actual table structure
                query = text("""
                    SELECT jsonl_content 
                    FROM dataset_output_table 
                    WHERE dataset_id = :dataset_id
                """)
                
                result = session.execute(query, {"dataset_id": dataset_id})
                rows = result.fetchall()
                
                # Convert rows to list of dictionaries
                return [json.loads(row[0]) for row in rows if row[0]]
                
        except Exception as e:
            raise Exception(f"Error fetching dataset records: {str(e)}")

    def split_data(
        self, 
        data: List[Dict], 
        train_percent: int, 
        valid_percent: int, 
        test_percent: int
    ) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """
        Split the data into training, validation, and test sets
        
        Args:
            data: List of data records
            train_percent: Percentage for training set
            valid_percent: Percentage for validation set
            test_percent: Percentage for test set
            
        Returns:
            Tuple of (training_data, validation_data, test_data)
        """
        if train_percent + valid_percent + test_percent != 100:
            raise ValueError("Percentages must sum to 100")

        # Shuffle the data
        shuffled_data = data.copy()
        random.shuffle(shuffled_data)
        
        total_records = len(shuffled_data)
        train_size = int(total_records * train_percent / 100)
        valid_size = int(total_records * valid_percent / 100)
        
        # Split the data
        train_data = shuffled_data[:train_size]
        valid_data = shuffled_data[train_size:train_size + valid_size]
        test_data = shuffled_data[train_size + valid_size:]
        
        return train_data, valid_data, test_data

    def write_jsonl_file(self, data: List[Dict], filepath: str) -> None:
        """
        Write data to a JSONL file
        
        Args:
            data: List of dictionaries to write
            filepath: Path to the output file
        """
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            for record in data:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')

    def prepare_jsonl(
        self, 
        dataset_id: str, 
        output_path: str,
        train_percent: int = 70,
        valid_percent: int = 20,
        test_percent: int = 10
    ) -> Dict[str, str]:
        """
        Prepare training, validation, and test JSONL files from the dataset
        
        Args:
            dataset_id: ID of the dataset to process
            output_path: Directory to save the JSONL files
            train_percent: Percentage of data for training
            valid_percent: Percentage of data for validation
            test_percent: Percentage of data for testing
            
        Returns:
            Dictionary with paths to the created files
        """
        try:
            # Create output directory if it doesn't exist
            os.makedirs(output_path, exist_ok=True)
            
            # Get all records from database
            all_records = self.get_all_dataset_jsonl(dataset_id)
            
            if not all_records:
                raise Exception(f"No records found for dataset {dataset_id}")
            
            # Split the data
            train_data, valid_data, test_data = self.split_data(
                all_records,
                train_percent,
                valid_percent,
                test_percent
            )
            
            # Define file paths
            train_file = os.path.join(output_path, "train.jsonl")
            valid_file = os.path.join(output_path, "valid.jsonl")
            test_file = os.path.join(output_path, "test.jsonl")
            
            # Write files
            self.write_jsonl_file(train_data, train_file)
            self.write_jsonl_file(valid_data, valid_file)
            self.write_jsonl_file(test_data, test_file)
            
            # Return paths to created files
            return {
                "train_file": train_file,
                "valid_file": valid_file,
                "test_file": test_file,
                "total_records": len(all_records),
                "train_records": len(train_data),
                "valid_records": len(valid_data),
                "test_records": len(test_data)
            }
            
        except Exception as e:
            raise Exception(f"Failed to prepare JSONL files: {str(e)}")

    def validate_jsonl_files(self, file_paths: Dict[str, str]) -> bool:
        """
        Validate the created JSONL files
        
        Args:
            file_paths: Dictionary containing paths to the JSONL files
            
        Returns:
            True if files are valid, raises exception otherwise
        """
        try:
            for file_type, filepath in file_paths.items():
                if not os.path.exists(filepath):
                    raise Exception(f"File not found: {filepath}")
                
                # Validate file content
                with open(filepath, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        try:
                            json.loads(line.strip())
                        except json.JSONDecodeError as e:
                            raise Exception(f"Invalid JSON in {file_type} at line {line_num}: {str(e)}")
            
            return True
            
        except Exception as e:
            raise Exception(f"File validation failed: {str(e)}")
