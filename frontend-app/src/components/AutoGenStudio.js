import React from 'react';

const AutoGenStudio = () => {
  return (
    <div className="autogen-container">
      <iframe
        src="http://localhost:8081"
        title="AutoGen Studio"
        width="100%"
        height="600px"
        frameBorder="0"
      />
    </div>
  );
};

export default AutoGenStudio;