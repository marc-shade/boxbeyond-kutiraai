import React from 'react';

const Qdrant = () => {
  return (
    <div className="autogen-container">
      <iframe
        src="http://localhost:6333/dashboard"
        title="Qdrant Dashboard"
        width="100%"
        height="600px"
      />
    </div>
  );
};

export default Qdrant;