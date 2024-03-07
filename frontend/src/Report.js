import ResponsiveAppBar from './ResponsiveAppBar'
import Disclaimer from './Disclaimer';
import { useParams } from 'react-router-dom';

import Footer from './Footer';
import Grid from '@mui/material/Grid';
import GeneralTable from './GeneralTable';
import SyntaxResult from './SyntaxResult';
import SchemaResult from './SchemaResult';
import BsddTreeView from './BsddTreeView'
//import GherkinResults from './GherkinResult';
import GherkinResults2 from './GherkinResult2';
import SideMenu from './SideMenu';

import { useEffect, useState, useContext } from 'react';
import { FETCH_PATH } from './environment';
import { PageContext } from './Page';
import HandleAsyncError from './HandleAsyncError';

function Report({ kind }) {
  const context = useContext(PageContext);

  const [isLoggedIn, setLogin] = useState(false);
  const [reportData, setReportData] = useState({});
  const [user, setUser] = useState(null)
  const [isLoaded, setLoadingStatus] = useState(false)

  const { modelCode } = useParams()

  const [prTitle, setPrTitle] = useState("")
  const [commitId, setCommitId] = useState("")

  const handleAsyncError = HandleAsyncError();

  useEffect(() => {
    fetch(context.sandboxId ? `${FETCH_PATH}/api/sandbox/me/${context.sandboxId}` : `${FETCH_PATH}/api/me`)
      .then(response => response.json())
      .then((data) => {
        if (data["redirect"] !== undefined && data["redirect"] !== null) {
          if (!window.location.href.endsWith(data.redirect)) {
            window.location.href = data.redirect;
          }
        }
        else {
          setLogin(true);
          setUser(data["user_data"]);
          data["sandbox_info"]["pr_title"] && setPrTitle(data["sandbox_info"]["pr_title"]);
          data["sandbox_info"]["commit_id"] && setCommitId(data["sandbox_info"]["commit_id"]);
        }
      }).catch(handleAsyncError);
  }, [context, handleAsyncError]);


  function getReport(code, kind) {
    fetch(`${FETCH_PATH}/api/report2/${code}?type=${kind}`)
      .then(response => response.json())
      .then((data) => {
        setReportData(data);
        setLoadingStatus(true);
      })
  }

  function status_combine(...args) {
    const statuses = ["-", "p", "v", "n", "w", "i"];
    return statuses[Math.max(...args.map(s => statuses.indexOf(s)))];
  }

  useEffect(() => {
    getReport(modelCode, kind);
  }, [modelCode, kind]);

  if (isLoggedIn) {
    console.log("Report data ", reportData);
    return (
      <div>
        <Grid direction="column"
          container
          style={{
            minHeight: '100vh', alignItems: 'stretch',
          }} >
          <ResponsiveAppBar user={user} />
          <Grid
            container
            flex={1}
            direction="row"
            style={{
            }}
          >
            <SideMenu />

            <Grid
              container
              flex={1}
              direction="column"
              style={{
                justifyContent: "space-between",
                overflow: 'scroll',
                boxSizing: 'border-box',
                maxHeight: '90vh',
                overflowX: 'hidden'
              }}
            >
              <div style={{
                gap: '10px',
                flex: 1
              }}>
                <Grid
                  container
                  spacing={0}
                  direction="column"
                  alignItems="center"
                  justifyContent="space-between"
                  style={{
                    minHeight: '100vh', gap: '15px', backgroundColor: 'rgb(242 246 248)',
                    border: context.sandboxId ? 'solid 12px red' : 'none'
                  }}
                >
                  {context.sandboxId && <h2
                    style={{
                      background: "red",
                      color: "white",
                      marginTop: "-16px",
                      lineHeight: "30px",
                      padding: "12px",
                      borderRadius: "0 0 16px 16px"
                    }}
                  >Sandbox for <b>{prTitle}</b></h2>}
                  <Disclaimer />
                  {isLoaded
                    ? <>
                        {(kind === "file") && <h2>File Metrics</h2>}
                        {(kind === "syntax") && <h2>STEP Syntax Report</h2>}
                        {(kind === "schema") && <h2>IFC Schema Report</h2>}
                        {(kind === "bsdd") && <h2>bSDD Compliance Report</h2>}
                        {(kind === "normative") && <h2>Normative IFC Rules Report</h2>}
                        {(kind === "industry") && <h2>Industry Practices Report</h2>}

                        <GeneralTable data={reportData} type={"general"} />

                        {(kind === "syntax") && <SyntaxResult 
                          status={reportData.model.status_syntax} 
                          summary={"STEP Syntax"} 
                          content={reportData.results.syntax_results} />}

                        {(kind === "schema") && <SchemaResult 
                          status={reportData.model.status_schema} 
                          summary={"IFC Schema"} 
                          content={[...reportData.results.schema_results, ...reportData.results.prereq_rules_results]} 
                          instances={reportData.instances} />}

                        {(kind === "bsdd") && <BsddTreeView 
                          status={reportData.model.status_bsdd} 
                          summary={"bSDD Compliance"} 
                          bsddResults={reportData.results.bsdd_results} />}

                        {(kind === "normative") && <GherkinResults2 
                          status={reportData.model.status_rules} 
                          summary={"Normative IFC Rules"}
                          content={reportData.results.norm_rules_results} 
                          instances={reportData.instances} />}
                          
                        {(kind === "industry") && <GherkinResults2 
                          status={reportData.model.status_ind}
                          summary={"Industry Practices"}
                          content={reportData.results.ind_rules_results} 
                          instances={reportData.instances} />}
                      </>
                    : <div>Loading...</div>}
                  <Footer />
                </Grid>
              </div>
            </Grid>
          </Grid>
        </Grid>
      </div>
    );
  }
}

export default Report;