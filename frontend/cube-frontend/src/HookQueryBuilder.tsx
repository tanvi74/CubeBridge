import React, { useState, useEffect, useMemo } from 'react';
import { useCubeQuery } from '@cubejs-client/react';
import { Button, Card, Row, Col, Typography, Spin, Alert, Table, Checkbox, Space, Tag, Divider } from 'antd';
import { ReloadOutlined, FilterOutlined, BarChartOutlined, TableOutlined } from '@ant-design/icons';
import cubeApi from './cubejs-client';
import './QueryBuilder.css';

const { Title, Text } = Typography;

interface Dimension {
  name: string;
  title: string;
  shortTitle: string;
  cubeName: string;
  type: string;
}

interface Measure {
  name: string;
  title: string;
  shortTitle: string;
  cubeName: string;
  type: string;
}

interface Cube {
  name: string;
  measures: Measure[];
  dimensions: Dimension[];
}

const HookQueryBuilder: React.FC = () => {
  const [selectedCubes, setSelectedCubes] = useState<string[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<Dimension[]>([]);
  const [availableMeasures, setAvailableMeasures] = useState<Measure[]>([]);
  const [cubes, setCubes] = useState<Cube[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState<string>('');
  const [sqlLoading, setSqlLoading] = useState(false);

  // Fetch available cubes, measures, and dimensions from backend
  useEffect(() => {
    const fetchMeta = async () => {
      console.log('🔍 Fetching cube metadata for Simple Hook Query Builder...');
      
      try {
        const response = await fetch('http://localhost:4000/cubejs-api/v1/meta', {
          headers: {
            'Authorization': 'secret'
          }
        });
        const meta = await response.json();
        
        console.log('✅ Meta data received:', meta);
        
        const dimensions: Dimension[] = [];
        const measures: Measure[] = [];
        const cubesData: Cube[] = [];
        
        // Extract dimensions and measures from all cubes
        meta.cubes.forEach((cube: { name: string; measures: Measure[]; dimensions: Dimension[] }) => {
          cubesData.push({
            name: cube.name,
            measures: cube.measures,
            dimensions: cube.dimensions
          });
          
          cube.dimensions.forEach((dimension: { name: string; title: string; shortTitle: string; type: string }) => {
            dimensions.push({
              name: dimension.name,
              title: dimension.title,
              shortTitle: dimension.shortTitle,
              cubeName: cube.name,
              type: dimension.type
            });
          });

          cube.measures.forEach((measure: { name: string; title: string; shortTitle: string; type: string }) => {
            measures.push({
              name: measure.name,
              title: measure.title,
              shortTitle: measure.shortTitle,
              cubeName: cube.name,
              type: measure.type
            });
          });
        });
        
        setAvailableDimensions(dimensions);
        setAvailableMeasures(measures);
        setCubes(cubesData);
        setLoading(false);
        
        console.log(`📊 Loaded ${dimensions.length} dimensions and ${measures.length} measures from ${cubesData.length} cubes`);
      } catch (error) {
        console.error('❌ Failed to fetch cube metadata:', error);
        setLoading(false);
      }
    };

    fetchMeta();
  }, []);

  // Get relevant dimensions and measures based on selected cubes
  const relevantDimensions = useMemo(() => {
    if (selectedCubes.length === 0) return [];
    return availableDimensions.filter(dimension => 
      selectedCubes.includes(dimension.cubeName)
    );
  }, [selectedCubes, availableDimensions]);

  const relevantMeasures = useMemo(() => {
    if (selectedCubes.length === 0) return [];
    return availableMeasures.filter(measure => 
      selectedCubes.includes(measure.cubeName)
    );
  }, [selectedCubes, availableMeasures]);

  // Group dimensions and measures by cube for better organization
  const groupedDimensions = useMemo(() => {
    return relevantDimensions.reduce((acc, dimension) => {
      if (!acc[dimension.cubeName]) acc[dimension.cubeName] = [];
      acc[dimension.cubeName].push(dimension);
      return acc;
    }, {} as Record<string, Dimension[]>);
  }, [relevantDimensions]);

  const groupedMeasures = useMemo(() => {
    return relevantMeasures.reduce((acc, measure) => {
      if (!acc[measure.cubeName]) acc[measure.cubeName] = [];
      acc[measure.cubeName].push(measure);
      return acc;
    }, {} as Record<string, Measure[]>);
  }, [relevantMeasures]);

  // Use Cube.js hook for query execution
  const { resultSet, isLoading, error } = useCubeQuery({
    measures: selectedMeasures,
    dimensions: selectedDimensions,
    limit: 100
  }, {
    subscribe: true,
    cubeApi
  });

  // Fetch generated SQL for the current query
  const fetchGeneratedSQL = async (queryObj: { measures: string[]; dimensions: string[]; limit: number }) => {
    if (queryObj.dimensions.length === 0 && queryObj.measures.length === 0) {
      setGeneratedSQL('');
      return;
    }

    setSqlLoading(true);
    try {
      const response = await fetch('http://localhost:4000/cubejs-api/v1/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'secret'
        },
        body: JSON.stringify({ query: queryObj })
      });
      const sqlData = await response.json();
      
      if (sqlData.sql && sqlData.sql.sql && sqlData.sql.sql.length > 0) {
        setGeneratedSQL(sqlData.sql.sql[0]);
      } else {
        setGeneratedSQL('No SQL generated');
      }
    } catch (error) {
      console.error('❌ Failed to fetch SQL:', error);
      setGeneratedSQL('Error fetching SQL');
    }
    setSqlLoading(false);
  };

  // Fetch SQL whenever query changes
  useEffect(() => {
    const currentQuery = {
      measures: selectedMeasures,
      dimensions: selectedDimensions,
      limit: 100
    };
    fetchGeneratedSQL(currentQuery);
  }, [selectedMeasures, selectedDimensions]);

  const handleCubeSelection = (cubeName: string, checked: boolean) => {
    if (checked) {
      setSelectedCubes([...selectedCubes, cubeName]);
      // Auto-select all dimensions from the selected cube
      const cubeDimensions = availableDimensions
        .filter(dim => dim.cubeName === cubeName)
        .map(dim => dim.name);
      setSelectedDimensions(prev => [...prev, ...cubeDimensions]);
    } else {
      setSelectedCubes(selectedCubes.filter(c => c !== cubeName));
      // Remove dimensions and measures from deselected cube
      setSelectedDimensions(prev => prev.filter(d => {
        const dimension = availableDimensions.find(dim => dim.name === d);
        return dimension?.cubeName !== cubeName;
      }));
      setSelectedMeasures(prev => prev.filter(m => {
        const measure = availableMeasures.find(meas => meas.name === m);
        return measure?.cubeName !== cubeName;
      }));
    }
  };

  const handleDimensionSelection = (dimensionName: string, checked: boolean) => {
    setSelectedDimensions(prev => 
      checked 
        ? [...prev, dimensionName]
        : prev.filter(d => d !== dimensionName)
    );
  };

  const handleMeasureSelection = (measureName: string, checked: boolean) => {
    setSelectedMeasures(prev => 
      checked 
        ? [...prev, measureName]
        : prev.filter(m => m !== measureName)
    );
  };

  const resetQuery = () => {
    setSelectedCubes([]);
    setSelectedMeasures([]);
    setSelectedDimensions([]);
  };

  const renderChart = () => {
    if (isLoading) {
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
      <Title level={2}>
        <BarChartOutlined /> Hook-Based Query Builder
      </Title>
      <Text type="secondary">
        Clean and simple query builder using Cube.js hooks for real-time updates
      </Text>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
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
                      onChange={(e) => handleCubeSelection(cube.name, e.target.checked)}
                    >
                      <Tag color="blue">{cube.name}</Tag>
                    </Checkbox>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            <div className="query-section">
              <Title level={4}>
                <TableOutlined /> Measures ({relevantMeasures.length})
              </Title>
              <div style={{ marginBottom: 16 }}>
                {relevantMeasures.length === 0 ? (
                  <div style={{ color: '#999', fontStyle: 'italic', padding: '8px' }}>
                    Select cubes first to see relevant measures
                  </div>
                ) : (
                  Object.entries(groupedMeasures).map(([cubeName, measures]) => (
                    <div key={cubeName} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 'bold', color: '#666', fontSize: '12px', marginBottom: 4 }}>
                        {cubeName}
                      </div>
                      {measures.map((measure) => (
                        <div key={measure.name} style={{ marginBottom: 6, marginLeft: 8 }}>
                          <Checkbox
                            checked={selectedMeasures.includes(measure.name)}
                            onChange={(e) => handleMeasureSelection(measure.name, e.target.checked)}
                          >
                            <Text code>{measure.title}</Text>
                          </Checkbox>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Divider />

            <div className="query-section">
              <Title level={4}>
                <FilterOutlined /> Dimensions ({relevantDimensions.length})
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
                            onChange={(e) => handleDimensionSelection(dimension.name, e.target.checked)}
                          >
                            <Text code>{dimension.title}</Text>
                            <Tag color="green" style={{ marginLeft: 4 }}>
                              {dimension.type}
                            </Tag>
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
            title={
              <Space>
                <span>Query Results</span>
                {isLoading && <Spin size="small" />}
                {resultSet && (
                  <Tag color="green">
                    {resultSet.tablePivot().length} rows
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={resetQuery}
                type="primary"
              >
                Reset
              </Button>
            }
            className="results-panel"
          >
            {renderChart()}
          </Card>
        </Col>

        {/* Query JSON Display */}
        <Col span={24}>
          <Card title="Generated Query" className="query-json">
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify({
                measures: selectedMeasures,
                dimensions: selectedDimensions,
                limit: 100
              }, null, 2)}
            </pre>
          </Card>
        </Col>

        {/* Generated SQL Display */}
        <Col span={24}>
          <Card 
            title="Generated SQL" 
            className="sql-display"
            extra={
              sqlLoading && <Spin size="small" />
            }
          >
            {generatedSQL ? (
              <pre style={{ 
                background: '#f0f2f5', 
                padding: '15px', 
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '1.4',
                overflow: 'auto',
                maxHeight: '300px',
                border: '1px solid #d9d9d9'
              }}>
                {generatedSQL}
              </pre>
            ) : (
              <div style={{ 
                color: '#999', 
                fontStyle: 'italic', 
                padding: '15px',
                textAlign: 'center' 
              }}>
                Select cubes to see generated SQL
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HookQueryBuilder; 