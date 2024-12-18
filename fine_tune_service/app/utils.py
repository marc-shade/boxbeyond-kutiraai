# app/utils.py
import json
import os
import random
from typing import List, Dict
import logging
import json
import re

logger = logging.getLogger(__name__)

def clean_and_split_qa_pairs(text):
    # Remove outer quotes and unescape inner quotes
    text = text.strip('"').replace('\\"', '"')
    
    # Split the text into individual Q&A pairs
    pairs = re.findall(r'<s>\[INST\].*?\[/INST\].*?</s>', text)
    
    return pairs

def create_data_files(rows: List[tuple], test_percent: int, valid_percent: int, 
                     output_location: str) -> Dict[str, str]:
    """
    Create train, validation, and test JSONL files
    
    Args:
        rows: List of database rows containing JSONL content
        test_percent: Percentage of data for testing
        valid_percent: Percentage of data for validation
        output_location: Directory path from processed_file_full_path
        
    Returns:
        Dictionary containing paths to created files
    """
    try:
        logger.info(f"Creating data files in {output_location}")
        
        all_data = []
        for row in rows:
            # Assuming jsonl_content is the first column
            jsonl_content = row[0]
            
            # Split the content into individual Q&A pairs
            qa_pairs = clean_and_split_qa_pairs(jsonl_content)
    
            for pair in qa_pairs:
                # Create a dictionary with the "text" key and the Q&A pair as its value
                json_object = {"text": pair}
                
                # Convert the dictionary to a JSON string and append to all_data
                json_string = json.dumps(json_object, ensure_ascii=False)
                # Remove the outer quotes
                json_string = json_string.strip('"')
                all_data.append(json_string)
        
        # Calculate splits
        total = len(all_data)
        train_percent = 100 - (test_percent + valid_percent)
        
        logger.info(f"Total records: {total}, Split: {train_percent}/{valid_percent}/{test_percent}")
        
        # Shuffle the data
        random.shuffle(all_data)
        
        # Calculate sizes
        test_size = int(total * test_percent / 100)
        valid_size = int(total * valid_percent / 100)
        
        # Split data
        test_data = all_data[:test_size]
        valid_data = all_data[test_size:test_size + valid_size]
        train_data = all_data[test_size + valid_size:]
        
        # Create output directory if it doesn't exist
        os.makedirs(output_location, exist_ok=True)
        
        # Define file paths
        file_paths = {
            'train': os.path.join(output_location, 'train.jsonl'),
            'valid': os.path.join(output_location, 'valid.jsonl'),
            'test': os.path.join(output_location, 'test.jsonl')
        }
        
        # Write files
        for name, dataset in [
            ('train', train_data),
            ('valid', valid_data),
            ('test', test_data)
        ]:
            with open(file_paths[name], 'w', encoding='utf-8') as f:
                for item in dataset:
                    f.write(item + '\n')
            logger.info(f"Created {name} file with {len(dataset)} records: {file_paths[name]}")
        
        return file_paths
        
    except Exception as e:
        logger.error(f"Error creating data files: {str(e)}")
        raise Exception(f"Failed to create data files: {str(e)}")
