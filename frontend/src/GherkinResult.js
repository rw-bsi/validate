import * as React from 'react';
import { useEffect, useState } from 'react';
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Checkbox from "@mui/material/Checkbox";
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import { statusToColor, severityToLabel, statusToLabel, severityToColor } from './mappings';


function unsafe_format(obj) {
  if (typeof obj == 'object' && 'value' in obj) {
    if (typeof obj.value === 'string' || obj.value instanceof String || typeof obj.value === 'number' || typeof obj.value === 'boolean') {
      return <span style={{background: '#00000010', padding: '3px'}}>{obj.value}</span>
    } else {
      return unsafe_format(obj.value);
    }
  } else if (typeof obj === 'string' || obj instanceof String) {
    return <i>{obj}</i>;
  } else if (typeof obj == 'object' && 'entity' in obj) {
    // @todo actual URL for schema
    var entity = obj.entity.split('(#')[0];
    return <a href={`https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/${entity}.htm`}>{entity}</a>
  } else if (typeof obj == 'object' && 'oneOf' in obj) {
    return <ul>{obj.oneOf.map((v,idx) =><li key={idx}>{v}</li>)}</ul>
  } else {
    return JSON.stringify(obj);
  }
}

function format(obj) {
  try {
    return unsafe_format(obj);
  } catch(err) {
    return JSON.stringify(obj);
  }
}

export default function GherkinResult({ summary, content, status, instances }) {
  const [data, setRows] = useState([])
  const [grouped, setGrouped] = useState([])
  const [page, setPage] = useState(0);  
  const [checked, setChecked] = useState(false);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };  

  const handleChangeChecked = (event) => {
    setChecked(event.target.checked);
    if (checked) {
      setPage(0);
    }
  };

  useEffect(() => {
    let grouped = [];
    let filteredContent = content.filter(function(el) {
      return checked || el.severity > 2; // all or warning/error only?
    });

    // normalize columns
    filteredContent = filteredContent.map(function(el) {

      const container = {};
      container['instance_id'] = el.instance_id ? el.instance_id : '-';
      container.feature = el.feature;
      container.feature_version = el.feature_version;
      container.feature_url = el.feature_url;
      container.feature_text = el.feature_text;
      container.observed = el.observed ? el.observed : '-';
      container.expected = el.expected ? el.expected : '-';
      container.severity = el.severity;
      container.msg = el.msg;
      
      return container
    })
    
    // deduplicate
    const uniqueArray = (array, key) => {

      return [
        ...new Map(
          array.map( x => [key(x), x])
        ).values()
      ]
    }

    filteredContent = uniqueArray(filteredContent, c => c.instance_id + c.feature);
    
    // sort
    filteredContent.sort((f1, f2) => f1.feature > f2.feature ? 1 : -1);

    for (let c of (filteredContent || [])) {
      if (grouped.length === 0 || (c.feature ? c.feature : 'Uncategorized') !== grouped[grouped.length-1][0]) {
        grouped.push([c.feature ? c.feature : 'Uncategorized',[]])
      }
      grouped[grouped.length-1][1].push(c);
    }

    // aggregate severity
    for (let g of (grouped || [])) {
      g[2] = Math.max(...g[1].map(f => f.severity))
    }

    // order features
    grouped.sort((f1, f2) => f1[0] > f2[0] ? 1 : -1);

    setRows(grouped.slice(page * 10, page * 10 + 10))
    setGrouped(grouped)
  }, [page, content, checked]);

  return (
    <div>
      <TableContainer sx={{ maxWidth: 850 }} component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ borderColor: 'black', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {summary}
              </TableCell>
              <TableCell sx={{ borderColor: 'black', fontSize: 'small', textAlign: 'right' }} >
                <Checkbox size='small'
                  checked={checked}
                  onChange={handleChangeChecked}
                  tabIndex={-1}
                  disableRipple
                  color="default"
                  label="test"
                />include Passed, Disabled and N/A &nbsp;
                <Tooltip title='This also shows Passed, Disabled and N/A rule results.'>
                  <span style={{ display: 'inline-block'}}>
                    <span style={{fontSize: '.83em', verticalAlign: 'super'}}>ⓘ</span>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
       
      <Paper sx={{overflow: 'hidden',
            "width": "850px",
            ".MuiTreeItem-root .MuiTreeItem-root": { backgroundColor: "#ffffff80", overflow: "hidden" },
            ".MuiTreeItem-group .MuiTreeItem-content": { boxSizing: "border-box" },
            ".MuiTreeItem-group": { padding: "16px", marginLeft: 0 },
            "> li > .MuiTreeItem-content": { padding: "16px" },
            ".MuiTreeItem-content.Mui-expanded": { borderBottom: 'solid 1px black' },
            ".MuiTreeItem-group .MuiTreeItem-content.Mui-expanded": { borderBottom: 0 },
            ".caption" : { paddingTop: "1em", paddingBottom: "1em", textTransform: 'capitalize' },
            ".subcaption" : { visibility: "hidden", fontSize: '80%' },
            ".MuiTreeItem-content.Mui-expanded .subcaption" : { visibility: "visible" },
            "table": { borderCollapse: 'collapse', fontSize: '80%' },
            "td, th": { padding: '0.2em 0.5em', verticalAlign: 'top' },
            ".pre": {
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              // overflowWrap: 'break-word'
            },
            ".mono": { fontFamily: 'monospace, monospace', marginTop: '0.3em' }
          }}
        >
          <div style={{ "backgroundColor": statusToColor[status], padding: '0.1em 0.0em' }} key={Math.random()}>
            { data.length
              ? data.map(([feature, rows, severity], index) => {
                  const hasMessage = rows.some(row => row.message && row.message.length > 0)
                  return <TreeView 
                    defaultCollapseIcon={<ExpandMoreIcon />}
                    defaultExpandIcon={<ChevronRightIcon />}
                    key={index}
                    >
                      <TreeItem 
                        nodeId={feature} 
                        label={<div className='caption'>{feature}</div>} 
                        sx={{ "backgroundColor": severityToColor[severity] }}
                      >
                        <div>
                          ⓘ {rows[0].feature_text !== null ? rows[0].feature_text : '-'}
                          <br />
                          <br />
                          <a size='small' target='blank' href={rows[0].feature_url}>{rows[0].feature_url}</a>
                          <br />
                          <br />                        
                        </div>
                        <table width='100%' style={{ 'textAlign': 'left'}} key={Math.random()}>
                          <thead>
                            <tr><td>Severity</td><td>Id</td><td>Entity</td><td>Expected</td><td>Observed</td>{hasMessage && <td>Message</td>}</tr>
                          </thead>
                          <tbody>
                            {
                              rows.map((row, index) => {
                                return <TableRow key={index}> 
                                  <td>{severityToLabel[row.severity]}</td>
                                  <td>{row.instance_id ? (instances[row.instance_id] ? instances[row.instance_id].guid : '?') : '-'}</td>
                                  <td>{row.instance_id ? (instances[row.instance_id] ? instances[row.instance_id].type : '?') : '-'}</td>
                                  <td>{row.expected ? format(row.expected) : '-'}</td>
                                  <td>{row.observed ? format(row.observed) : '-'}</td>
                                  {hasMessage && <td>{row.message && row.message.length > 0 ? row.message : '-'}</td>}
                                </TableRow>
                              })
                            }
                          </tbody>
                        </table>
                      </TreeItem>
                    </TreeView>
                })
              : <div style={{ margin: '0.5em 1em' }}>{statusToLabel[status]}</div> }
            {
              grouped.length && grouped.length > 0
              ? <TablePagination
                  sx={{display: 'flex', justifyContent: 'center'}}
                  rowsPerPageOptions={[10]}
                  component="div"
                  count={grouped.length}
                  rowsPerPage={10}
                  page={page}
                  onPageChange={handleChangePage}
                />
              : null
            }
          </div>
      </Paper>
    </div>
  );
}
