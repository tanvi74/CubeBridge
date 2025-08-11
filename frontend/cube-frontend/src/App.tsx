import { useState } from 'react';
import { Tabs } from 'antd';
import QueryBuilder from './QueryBuilder';
import HookQueryBuilder from './HookQueryBuilder';
import 'antd/dist/reset.css';

const { TabPane } = Tabs;

function App() {
  const [activeTab, setActiveTab] = useState('component');

  return (
    <div className="App">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        size="large"
        style={{ padding: '20px' }}
      >
        <TabPane tab="Component-Based Query Builder" key="component">
          <QueryBuilder />
        </TabPane>
        <TabPane tab="Hook-Based Query Builder" key="hook">
          <HookQueryBuilder />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default App;
