-- Database creation is handled by Docker initialization
-- This script runs within the product_db database

-- configuration_table definition

-- Drop table

-- DROP TABLE configuration_table;

CREATE TABLE IF NOT EXISTS configuration_table (
	id serial4 NOT NULL,
	config_name varchar NOT NULL,
	config_value varchar NULL,
	CONSTRAINT configuration_table_pk PRIMARY KEY (id),
	CONSTRAINT configuration_table_unique UNIQUE (config_name)
);

-- public.dataset_master_table definition

-- Drop table

-- DROP TABLE public.dataset_master_table;

CREATE TABLE IF NOT EXISTS public.dataset_master_table (
	id serial4 NOT NULL,
	dataset_name varchar NOT NULL,
	dataset_workflow_url varchar NOT NULL,
	dataset_desc varchar NULL,
	dataset_model_template varchar NOT NULL,
	dataset_status varchar NULL,
	dataset_system_prompt varchar NULL,
	dataset_origin varchar NOT NULL,
	dataset_domain varchar NOT NULL,
	dataset_filepath varchar,
	CONSTRAINT dataset_master_table_pk PRIMARY KEY (id),
	CONSTRAINT dataset_master_table_unique UNIQUE (dataset_name)
);

-- dataset_output_table definition

-- Drop table

-- DROP TABLE dataset_output_table;

CREATE TABLE IF NOT EXISTS dataset_output_table (
	id serial4 NOT NULL,
	dataset_id serial4 NOT NULL,
	chunk_text text NULL,
	jsonl_content varchar NULL,
	filename varchar NULL
);


-- dataset_output_table foreign keys

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'dataset_output_table_dataset_master_table_fk'
    ) THEN
        ALTER TABLE dataset_output_table ADD CONSTRAINT dataset_output_table_dataset_master_table_fk FOREIGN KEY (dataset_id) REFERENCES dataset_master_table(id);
    END IF;
END $$;

-- dataset_template_table definition

-- Drop table

-- DROP TABLE dataset_template_table;

CREATE TABLE IF NOT EXISTS dataset_template_table (
	id serial4 NOT NULL,
	model_name varchar NOT NULL,
	model_template varchar NOT NULL,
	model_description varchar NULL,
	CONSTRAINT dataset_template_table_pk PRIMARY KEY (id),
	CONSTRAINT dataset_template_table_unique UNIQUE (model_name)
);

-- Add this to /Users/dan/workspace/projects/product/product-backend-app/db/init/01-init.sql

-- finetune_master_table definition
CREATE TABLE IF NOT EXISTS finetune_master_table (
    id serial4 NOT NULL,
    model_name varchar NOT NULL,
    base_model varchar NOT NULL,
    model_owner varchar NOT NULL,
    model_type varchar NOT NULL,
    dataset_id int4 NOT NULL,
    num_iterations int4 NOT NULL DEFAULT 1000,
    steps_per_eval int4 NOT NULL DEFAULT 100,
    num_layers int4 NOT NULL DEFAULT 16,
    learning_rate varchar NOT NULL DEFAULT '1e-5',
    batch_size int4 NOT NULL DEFAULT 25,
    train_split int4 NOT NULL DEFAULT 70,
    validation_split int4 NOT NULL DEFAULT 20,
    test_split int4 NOT NULL DEFAULT 10,
    processed_file_full_path varchar NOT NULL,
    finetuned_model_name varchar NOT NULL,
    status varchar DEFAULT 'pending',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT finetune_master_table_pk PRIMARY KEY (id),
    CONSTRAINT finetune_master_table_model_name_unique UNIQUE (model_name),
    CONSTRAINT finetune_master_table_dataset_fk FOREIGN KEY (dataset_id)
        REFERENCES dataset_master_table(id) ON DELETE RESTRICT
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'update_finetune_master_updated_at'
    ) THEN
        CREATE TRIGGER update_finetune_master_updated_at
            BEFORE UPDATE ON finetune_master_table
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS finetune_tasks (
    task_id VARCHAR(255) PRIMARY KEY,
    config_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_step VARCHAR(255),
    progress FLOAT DEFAULT 0.0,  -- 0 to 100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    result JSONB,
    error TEXT,
    metrics JSONB,

    -- Add indexes for commonly queried columns
    CONSTRAINT status_check CHECK (status IN (
        'PREPARING',
        'DATASET_CREATION',
        'DATASET_COMPLETE',
        'HF_LOGIN',
        'FINETUNING',
        'CREATING_MODEL',
        'OLLAMA_IMPORT',
        'COMPLETED',
        'FAILED'
    ))
);

-- Create index on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_finetune_tasks_config_id ON finetune_tasks(config_id);
CREATE INDEX IF NOT EXISTS idx_finetune_tasks_status ON finetune_tasks(status);
CREATE INDEX IF NOT EXISTS idx_finetune_tasks_created_at ON finetune_tasks(created_at);

-- Function already created above, no need to recreate

-- Create a trigger to automatically update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'update_finetune_tasks_updated_at'
    ) THEN
        CREATE TRIGGER update_finetune_tasks_updated_at
            BEFORE UPDATE ON finetune_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
