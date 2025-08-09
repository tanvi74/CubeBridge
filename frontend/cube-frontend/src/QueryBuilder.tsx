import React, { useState, useEffect, useRef } from 'react';
import { QueryRenderer } from '@cubejs-client/react';
import { Button, Card, Row, Col, Typography, Spin, Alert, Table, Checkbox } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import cubeApi from './cubejs-client';
import './QueryBuilder.css';

const { Title } = Typography;

interface Dimension {
  name: string;
  title: string;
  shortTitle: string;
  cubeName: string;
}

interface Cube {
  name: string;
  measures: any[];
  dimensions: any[];
}

const QueryBuilder: React.FC = () => {
  const [selectedCubes, setSelectedCubes] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<Dimension[]>([]);
  const [cubes, setCubes] = useState<Cube[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedMeta = useRef(false);

  // Fetch available cubes, measures, and dimensions from backend
  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasFetchedMeta.current) return;
    
    const fetchMeta = async () => {
      hasFetchedMeta.current = true;
      console.log('🔍 Fetching cube metadata...');
      
      try {
        const response = await fetch('http://localhost:4000/cubejs-api/v1/meta', {
          headers: {
            'Authorization': 'secret'
          }
        });
        const meta = await response.json();
        
        console.log('✅ Meta data received:', meta);
        
        const dimensions: Dimension[] = [];
        const cubesData: Cube[] = [];
        
        // Extract dimensions from all cubes
        meta.cubes.forEach((cube: any) => {
          cubesData.push({
            name: cube.name,
            measures: cube.measures,
            dimensions: cube.dimensions
          });
          
          cube.dimensions.forEach((dimension: any) => {
            dimensions.push({
              name: dimension.name,
              title: dimension.title,
              shortTitle: dimension.shortTitle,
              cubeName: cube.name
            });
          });
        });
        
        setAvailableDimensions(dimensions);
        setCubes(cubesData);
        setLoading(false);
        
        console.log(`📊 Loaded ${dimensions.length} dimensions from ${cubesData.length} cubes`);
      } catch (error) {
        console.error('❌ Failed to fetch cube metadata:', error);
        hasFetchedMeta.current = false; // Allow retry on error
        setLoading(false);
      }
    };

    fetchMeta();
  }, []);

  // Get relevant dimensions based on selected cubes
  const getRelevantDimensions = () => {
    if (selectedCubes.length === 0) {
      return []; // Show nothing if no cubes selected
    }

    // Return dimensions only from selected cubes
    return availableDimensions.filter(dimension => 
      selectedCubes.includes(dimension.cubeName)
    );
  };

  const relevantDimensions = getRelevantDimensions();

  // Auto-select all relevant dimensions when cubes are selected
  useEffect(() => {
    if (selectedCubes.length > 0) {
      const allRelevantDimensionNames = relevantDimensions.map(d => d.name);
      setSelectedDimensions(allRelevantDimensionNames);
    } else {
      setSelectedDimensions([]);
    }
  }, [selectedCubes, availableDimensions]);

  const query = {
    measures: [],
    dimensions: selectedDimensions,
    timeDimensions: [],
    filters: []
  };

  const renderChart = ({ resultSet, error, loadingState }: { resultSet?: any; error?: any; loadingState?: any }) => {
    if (loadingState?.isLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <p>Loading data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="Query Error"
          description={error.toString()}
          type="error"
          showIcon
        />
      );
    }

    if (!resultSet) {
      return (
        <Alert
          message="No Data"
          description="Please select measures or dimensions to see results"
          type="info"
          showIcon
        />
      );
    }

    const dataSource = resultSet.tablePivot();
    const columns = resultSet.tableColumns();
    
    return (
      <Table 
        dataSource={dataSource} 
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 'max-content', y: 400 }}
        size="small"
      />
    );
  };


  // Group dimensions by cube for better organization
  const groupedDimensions = relevantDimensions.reduce((acc, dimension) => {
    if (!acc[dimension.cubeName]) acc[dimension.cubeName] = [];
    acc[dimension.cubeName].push(dimension);
    return acc;
  }, {} as Record<string, Dimension[]>);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading cube metadata...</p>
      </div>
    );
  }

  return (
    <div className="query-builder-container">
      <Title level={2}>Smart Query Builder</Title>
      <p>
        {selectedCubes.length === 0 ? (
          <>Select cubes first to see relevant dimensions and build your query</>
        ) : (
          <>
            Showing {relevantDimensions.length} dimensions for your selected cubes
            <span style={{ color: '#1890ff' }}>
              {' '}(dynamically filtered)
            </span>
          </>
        )}
      </p>
      
      <Row gutter={[16, 16]}>
        {/* Query Builder Panel */}
        <Col xs={24} sm={24} md={24} lg={8} xl={8}>
          <Card title="Query Builder" className="query-panel">
            <div className="query-section">
              <Title level={4}>Cubes ({cubes.length})</Title>
              <div style={{ marginBottom: 16 }}>
                {cubes.map((cube) => (
                  <div key={cube.name} style={{ marginBottom: 12 }}>
                    <Checkbox
                      checked={selectedCubes.includes(cube.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCubes([...selectedCubes, cube.name]);
                        } else {
                          setSelectedCubes(selectedCubes.filter(c => c !== cube.name));
                        }
                      }}
                    >
                      {cube.name}
                    </Checkbox>
                  </div>
                ))}
              </div>
            </div>

            <div className="query-section">
              <Title level={4}>
                Dimensions ({relevantDimensions.length})
                {selectedCubes.length > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#888' }}>
                    {' '}• filtered
                  </span>
                )}
              </Title>
              <div style={{ marginBottom: 16 }}>
                {relevantDimensions.length === 0 ? (
                  <div style={{ color: '#999', fontStyle: 'italic', padding: '8px' }}>
                    Select cubes first to see relevant dimensions
                  </div>
                ) : (
                  Object.entries(groupedDimensions).map(([cubeName, dimensions]) => (
                    <div key={cubeName} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 'bold', color: '#666', fontSize: '12px', marginBottom: 4 }}>
                        {cubeName}
                      </div>
                      {dimensions.map((dimension) => (
                        <div key={dimension.name} style={{ marginBottom: 6, marginLeft: 8 }}>
                          <Checkbox
                            checked={selectedDimensions.includes(dimension.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDimensions([...selectedDimensions, dimension.name]);
                              } else {
                                setSelectedDimensions(selectedDimensions.filter(d => d !== dimension.name));
                              }
                            }}
                          >
                            {dimension.title}
                          </Checkbox>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </Col>

        {/* Results Panel */}
        <Col xs={24} sm={24} md={24} lg={16} xl={16}>
          <Card 
            title="Query Results"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSelectedCubes([]);
                  setSelectedDimensions([]);
                }}
              >
                Reset
              </Button>
            }
            className="results-panel"
          >
            <QueryRenderer
              query={query}
              cubeApi={cubeApi}
              render={renderChart}
            />
          </Card>
        </Col>

        {/* Query JSON Display */}
        <Col span={24}>
          <Card title="Generated Query" className="query-json">
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(query, null, 2)}
            </pre>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default QueryBuilder; 