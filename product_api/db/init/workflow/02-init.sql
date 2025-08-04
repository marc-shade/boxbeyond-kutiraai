-- Database creation is handled by Docker initialization
-- This script runs within the workflow_db database
-- public.workflows definition

-- Drop table

-- DROP TABLE public.workflows;

CREATE TABLE public.workflows (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"version" varchar(50) NULL,
	author varchar(255) NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	tags json NULL,
	config json NOT NULL,
	agents json NOT NULL,
	tasks json NOT NULL,
	is_active bool NULL,
	CONSTRAINT workflows_name_key UNIQUE (name),
	CONSTRAINT workflows_pkey PRIMARY KEY (id)
);


-- public.workflow_versions definition

-- Drop table

-- DROP TABLE public.workflow_versions;

CREATE TABLE public.workflow_versions (
	id serial4 NOT NULL,
	workflow_id int4 NULL,
	"version" varchar(50) NULL,
	config json NOT NULL,
	agents json NOT NULL,
	tasks json NOT NULL,
	created_at timestamp NULL,
	created_by varchar(255) NULL,
	CONSTRAINT workflow_versions_pkey PRIMARY KEY (id),
	CONSTRAINT workflow_versions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id)
);

-- insert a sample flow in the DB

INSERT INTO public.workflows ("name",description,"version",author,created_at,updated_at,tags,config,agents,tasks,is_active) VALUES
	 ('Research Organization','Workflow for researching a specific organization and providing a comprehensive report','1.0.0','Self','2024-12-13 14:15:56.853488','2024-12-13 14:24:55.177681','["Research"]','{"author": "Self", "version": "0.0.1", "tags": ["Research"], "inputs": [{"name": "organization_name", "description": "Name of the organization", "type": "string", "required": true}], "settings": {"process": "sequential"}}','{"researcher": {"role": "Senior Data Researcher", "name": "Researcher", "goal": "Uncover latest developments specific to an organization", "backstory": "You''re a seasoned researcher with a knack for uncovering the latest developments. Known for your ability to find the most relevant information and present it in a clear and concise manner", "verbose": true, "allow_delegation": false, "temperature": 0.5, "max_iter": 1}, "reporting analyst": {"role": "Reporting Analyst", "name": "Reporting Analyst", "goal": "Create detailed reports based on data analysis and research findings", "backstory": "You''re a meticulous analyst with a keen eye for detail. You''re known for your ability to turn complex data into clear and concise reports, making it easy for others to understand and act on the information you provide.", "verbose": true, "allow_delegation": false, "temperature": 0.5, "max_iter": 1}}','[{"name": "research task", "description": "A list with 10 bullet points of the most relevant information about {organization_name}", "agent": "researcher", "expected_output": "Conduct a thorough research about {organization_name} Make sure you find any interesting and relevant information given the current year is 2024."}, {"name": "Reporting Task", "description": "Review the context you got about {organization_name} and expand each topic into a full section for a report. Make sure the report is detailed and contains any and all relevant information", "agent": "reporting analyst", "expected_output": "A fully fledge reports with the mains topics, each with a full section of information. Formatted as markdown without ''```''"}]',true);
