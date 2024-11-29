import shutil
import os
import json
import random

def delete_all(base_path):
    """
    Delete all files and folders within the given base path.
    
    :param base_path: The directory path to clean
    """
    try:
        # Check if the path exists
        if not os.path.exists(base_path):
            print(f"The path {base_path} does not exist.")
            return

        # Use shutil.rmtree to remove the entire directory tree
        shutil.rmtree(base_path)
        print(f"Successfully deleted all contents of {base_path}")

        # Recreate the base directory
        os.makedirs(base_path)
        print(f"Recreated empty directory at {base_path}")

    except Exception as e:
        print(f"An error occurred while deleting {base_path}: {str(e)}")
        
def create_folder(folder_path):
    # Check if the folder already exists
    if os.path.exists(folder_path):
        print(f"Folder already exists: {folder_path}")
    else:
        # Create the folder
        os.makedirs(folder_path)
        print(f"Folder created: {folder_path}")
        
def create_data_files(rows, test_percent, valid_percent, output_location):
    # Process and distribute data
    all_data = []
    for row in rows:
        # Assuming jsonl_content is the first column
        jsonl_content = row[0]
        # Split the content by newline and process each entry
        entries = jsonl_content.strip().split('\n')
        for entry in entries:
            entry = entry.strip()
            if entry:  # Ensure the entry is not empty
                all_data.append(entry)

    # Calculate split sizes
    total = len(all_data)
    test_size = int(total * test_percent / 100)
    valid_size = int(total * valid_percent / 100)
    train_size = total - test_size - valid_size

    # Shuffle and split data
    random.shuffle(all_data)
    test_data = all_data[:test_size]
    valid_data = all_data[test_size:test_size+valid_size]
    train_data = all_data[test_size+valid_size:]

    # Write to files
    write_to_file(output_location + '/test.jsonl', test_data)
    write_to_file(output_location + '/valid.jsonl', valid_data)
    write_to_file(output_location + '/train.jsonl', train_data)
    
def write_to_file(filename, data):
    with open(filename, 'w') as f:
        for item in data:
            modified_item = "{\"text\": " + item + "}"
            f.write(f"{modified_item}\n")