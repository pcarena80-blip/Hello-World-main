import React from "react";
import UnifiedAIChat from "./UnifiedAIChat";

const AIChatDashboard = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white rounded-lg shadow-md p-6">
        <UnifiedAIChat />
      </div>
    </div>
  );
};

export default AIChatDashboard;
