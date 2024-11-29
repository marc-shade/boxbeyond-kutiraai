import psycopg2
import os


def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="rooot",
        user=os.environ['DB_USERNAME'],
        password=os.environ['DB_PASSWORD'])
    return conn

def get_dataset():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT M.*, T.model_name, T.model_template FROM dataset_master_table M INNER JOIN dataset_template_table T on M.dataset_model_template = T.id;')
    # Fetch column names
    column_names = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    # close the resources
    cur.close()
    conn.close()
    # Create a list of dictionaries (each dict represents a row)
    dataset = [dict(zip(column_names, row)) for row in rows]
    return dataset

def get_dataset_by_id(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM dataset_master_table WHERE id = %s;', (id,))
    # Fetch column names
    column_names = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    # close the resources
    cur.close()
    conn.close()
    # Create a dictionary (representing the row)
    dataset = dict(zip(column_names, row))
    return dataset

def insert_dataset(dataset):
    conn = get_db_connection()
    cur = conn.cursor()
    inserted_id = None
    try:
        cur.execute('INSERT INTO dataset_master_table (dataset_name, dataset_desc, dataset_input_location, \
                    dataset_output_location, dataset_model_template, dataset_system_prompt, dataset_status) \
                    VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;',
                    (dataset['name'], dataset['description'], dataset['inputLocation'],
                    '', dataset['promptTemplate'], dataset['systemPrompt'], 'Pending'))
        
        result = cur.fetchone()
        if result:
            inserted_id = result[0]
            conn.commit()
            print(f"The inserted row has id: {inserted_id}")
        else:
            print("No row was inserted")
            conn.rollback()

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()
        
    return inserted_id

def get_all_dataset_jsonl(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT jsonl_content FROM dataset_output_table WHERE dataset_id = %s;', (id, ))
    # Fetch column names
    rows = cur.fetchall()
    # close the resources
    cur.close()
    conn.close()
    
    return rows

def get_dataset_templates():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM dataset_template_table;')
    # Fetch column names
    column_names = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    # close the resources
    cur.close()
    conn.close()
    # Create a list of dictionaries (each dict represents a row)
    dataset_templates = [dict(zip(column_names, row)) for row in rows]
    return dataset_templates

def get_dataset_template_by_id(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM dataset_template_table WHERE id = %s;', (id, ))
    # Fetch column names
    column_names = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    # close the resources
    cur.close()
    conn.close()
    # Create a dictionary (representing the row)
    dataset_template = dict(zip(column_names, row))
    return dataset_template

def upsert_dataset_template(dataset):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO dataset_template_table (model_name, model_template, model_description) \
                    VALUES (%s, %s, %s) ON CONFLICT (model_name) DO UPDATE SET \
                    model_template = EXCLUDED.model_template, \
                    model_description = EXCLUDED.model_description;',
                    (dataset['model_name'], dataset['model_template'], dataset['model_description']))

        conn.commit()
        print(f"Upserted dataset template: {dataset['model_name']}")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        conn.rollback()

    finally:
        cur.close()
        conn.close()
        
def get_configuration():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM configuration_table;')
    # Fetch column names
    column_names = [desc[0] for desc in cur.description]
    rows = cur.fetchall()
    # close the resources
    cur.close()
    conn.close()
    # Create a list of dictionaries (each dict represents a row)
    configuration = [dict(zip(column_names, row)) for row in rows]
    return configuration

def get_configuration_by_id(id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM configuration_table WHERE id = %s;', (id,))
    # Fetch column names
    column_names = [desc[0] for desc in cur.description]
    row = cur.fetchone()
    # close the resources
    cur.close()
    conn.close()
    # Create a dictionary (representing the row)
    configuration = dict(zip(column_names, row))
    return configuration

def upsert_configuration(configuration):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO configuration_table (config_name, config_value) \
                    VALUES (%s, %s) ON CONFLICT (config_name) DO UPDATE SET \
                    config_value = EXCLUDED.config_value;',
                    (configuration['config_name'], configuration['config_value']))

        conn.commit()
        print(f"Upserted configuration: {configuration['config_name']}")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        conn.rollback()

    finally:
        cur.close()
        conn.close()
        
def delete_configuration(id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('DELETE FROM configuration_table WHERE id = %s;', (id,))

        conn.commit()
        print(f"Deleted configuration: {id}")

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        conn.rollback()

    finally:
        cur.close()
        conn.close()