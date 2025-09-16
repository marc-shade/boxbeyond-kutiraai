import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Button } from '@mui/material';
import { PlainJsonEditor } from 'react-plain-json-editor';

const AgenticSettingsEditor = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [jsonData, setJsonData] = useState({
        workflow: {},
        agents: {},
        tasks: {}
    });
    const [existingConfigs, setExistingConfigs] = useState({
        workflow: null,
        agents: null,
        tasks: null
    });

    useEffect(() => {
        fetchConfigurations();
    }, []);

    const fetchConfigurations = async () => {
        const tabs = ['workflow', 'agents', 'tasks'];
        const newJsonData = {};
        const newExistingConfigs = {};

        for (const tab of tabs) {
            try {
                const response = await fetch(`http://localhost:8200/api/v1/configurations/agent_${tab}_config`);
                if (response.ok) {
                    const data = await response.json();
                    newJsonData[tab] = JSON.parse(data.config_value);
                    newExistingConfigs[tab] = data;
                } else {
                    newJsonData[tab] = {};
                    newExistingConfigs[tab] = null;
                }
            } catch (error) {
                console.error(`Error fetching ${tab} configuration:`, error);
                newJsonData[tab] = {};
                newExistingConfigs[tab] = null;
            }
        }

        setJsonData(newJsonData);
        setExistingConfigs(newExistingConfigs);
        console.log(newJsonData);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleJsonChange = (tab) => (newData) => {
        setJsonData((prevData) => ({
            ...prevData,
            [tab]: newData
        }));
    };

    const handleSave = async (tab) => {
        console.log(`Saving ${tab} data:`, jsonData[tab]);

        const configName = `agent_${tab}_config`;
        const method = existingConfigs[tab] ? 'PUT' : 'POST';
        const url = existingConfigs[tab] 
            ? `http://localhost:8200/api/v1/configurations/${configName}` 
            : 'http://localhost:8200/api/v1/configurations';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config_name: configName,
                    config_value: JSON.stringify(jsonData[tab])
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log(`${method} request successful:`, result);

            // Update existingConfigs after successful save
            setExistingConfigs(prev => ({
                ...prev,
                [tab]: result
            }));

        } catch (error) {
            console.error("Error saving data:", error);
        }
    };

    const renderJsonEditor = (tab) => (
        <Box sx={{ mt: 2 }}>
            <PlainJsonEditor
                value={jsonData[tab]}
                onChange={handleJsonChange(tab)}
                submitKeys={["command+s", "ctrl+s"]}
            />
            <Button variant="contained" onClick={() => handleSave(tab)} sx={{ mt: 2 }}>
                Save
            </Button>
        </Box>
    );

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Workflow" />
                <Tab label="Agents" />
                <Tab label="Tasks" />
            </Tabs>
            {activeTab === 0 && renderJsonEditor('workflow')}
            {activeTab === 1 && renderJsonEditor('agents')}
            {activeTab === 2 && renderJsonEditor('tasks')}
        </Box>
    );
};

export default AgenticSettingsEditor;
