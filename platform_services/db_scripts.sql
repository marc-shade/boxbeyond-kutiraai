-- public.configuration_table definition

-- Drop table

-- DROP TABLE public.configuration_table;

CREATE TABLE public.configuration_table (
	id serial4 NOT NULL,
	config_name varchar NOT NULL,
	config_value varchar NULL,
	CONSTRAINT configuration_table_pk PRIMARY KEY (id),
	CONSTRAINT configuration_table_unique UNIQUE (config_name)
);

-- public.dataset_master_table definition

-- Drop table

-- DROP TABLE public.dataset_master_table;

CREATE TABLE public.dataset_master_table (
	id serial4 NOT NULL,
	dataset_name varchar NOT NULL,
	dataset_input_location varchar NOT NULL,
	dataset_output_location varchar NULL,
	dataset_desc varchar NULL,
	dataset_model_template int4 NOT NULL,
	dataset_status varchar NULL,
	dataset_system_prompt varchar NOT NULL,
	CONSTRAINT dataset_master_table_pk PRIMARY KEY (id),
	CONSTRAINT dataset_master_table_unique UNIQUE (dataset_name)
);

-- public.dataset_output_table definition

-- Drop table

-- DROP TABLE public.dataset_output_table;

CREATE TABLE public.dataset_output_table (
	id serial4 NOT NULL,
	dataset_id serial4 NOT NULL,
	chunk_text text NULL,
	jsonl_content varchar NULL,
	filename varchar NULL
);


-- public.dataset_output_table foreign keys

ALTER TABLE public.dataset_output_table ADD CONSTRAINT dataset_output_table_dataset_master_table_fk FOREIGN KEY (dataset_id) REFERENCES public.dataset_master_table(id);

-- public.dataset_template_table definition

-- Drop table

-- DROP TABLE public.dataset_template_table;

CREATE TABLE public.dataset_template_table (
	id serial4 NOT NULL,
	model_name varchar NOT NULL,
	model_template varchar NOT NULL,
	model_description varchar NULL,
	CONSTRAINT dataset_template_table_pk PRIMARY KEY (id),
	CONSTRAINT dataset_template_table_unique UNIQUE (model_name)
);