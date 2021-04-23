import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import Frame from "react-frame-component";
import { pipe } from "ramda";

import { makeStyles } from "@material-ui/core/styles";
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Container,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@material-ui/core";

import { cereWebSDK } from "@cere/sdk-js";

type Payload = {
  [index: string]: string | number | undefined | Payload;
};

type LogMessage = {
  time: string;
  message: string;
  payload?: Payload;
};

type FormState = {
  appId: string;
  userId: string;
  eventName: string;
  eventPayload: string;
  isValid: boolean;
};

const useStyles = makeStyles((theme) => ({
  engagementPlaceholder: {
    border: 0,
    width: "100%",
    minHeight: "50vh",
  },
  engagementPreview: {
    background: "white",
  },
  fieldset: {
    border: 1,
    borderColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius,
    borderStyle: "solid",
    overflow: "auto",
    padding: theme.spacing(1, 2),
  },
  fieldsetLegend: {
    padding: theme.spacing(0, 2),
  },
  form: {
    marginTop: theme.spacing(3),
    width: "100%",
  },
  frame: {
    backgroundColor: theme.palette.background.default,
    border: "none",
    height: "100%",
    position: "relative",
    width: "100%",
  },
  logItem: {
    borderColor: theme.palette.divider,
    marginBottom: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  logPayload: {
    fontFamily: "monospace",
    fontSize: theme.typography.fontSize * 0.8,
    fontWeight: theme.typography.fontWeightLight,
    whiteSpace: "pre-wrap",
  },
  logsWrapper: {
    overflowX: "auto",
    wordBreak: "break-all",
  },
  paper: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    marginTop: theme.spacing(8),
  },
  preview: {
    height: "50vh",
    position: "relative",
  },
  submit: {
    margin: theme.spacing(0, 0, 5),
  },
}));

const DEBOUNCE_TIMEOUT = 500;

const stringify = (json: Payload) => JSON.stringify(json, null, 2);
// const parse = (value: string) =>
//   JSON.parse(value.replace(/\s+(\w+):\s+/g, '"$1":').replace(/,\s+}/, "}"));

const parse = (value: string) => JSON.parse(value);

function TabPanel(props) {
  const { children, value, index } = props;

  return <div hidden={value !== index}>{<Box p={3}>{children}</Box>}</div>;
}

function App() {
  const classes = useStyles();

  const [value, setValue] = useState(0);
  const [logs, setLogs] = useState<Array<LogMessage>>([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const [formState, setFormState] = useState({
    appId: process.env.REACT_APP_ID || "",
    userId: "",
    eventName: "",
    eventPayload: stringify({}),
    isValid: false,
  });

  const [engagementHtml, setEngagementHtml] = useState("");

  const containerForInAppMessages = useRef<HTMLDivElement>(null);

  const logEvent = (message: string, payload?: Payload) => {
    setLogs((logs) => [
      {
        time: (performance.now() / 1000).toFixed(3),
        message,
        payload,
      },
      ...logs,
    ]);
  };

  const sdk = useMemo(() => {
    if (formState.appId && formState.userId) {
      logEvent("Init SDK", { appId: formState.appId, userId: formState.userId });

      return cereWebSDK(formState.appId, formState.userId, {
        container: containerForInAppMessages.current,
        token: process.env.REACT_APP_API_KEY,
      });
    }
  }, [formState.appId, formState.userId, containerForInAppMessages.current]);

  useEffect(() => {
    if (sdk) {
      sdk.onEngagement((template: string) => {
        logEvent("Engagement", { template });
        setEngagementHtml(template);
      });

      logEvent("Registered custom engagement listener");
    }
  }, [sdk]);

  const debouncedValidateForm = useDebouncedCallback((formState: FormState) => {
    let eventPayload = formState.eventPayload;
    let isValid = Boolean(formState.appId) && Boolean(formState.userId) && Boolean(formState.eventName);

    if (eventPayload) {
      try {
        eventPayload = pipe(parse, stringify)(eventPayload);
      } catch (e) {
        isValid = false;
      }
    }

    setFormState({
      ...formState,
      eventPayload,
      isValid,
    });
  }, DEBOUNCE_TIMEOUT);

  useEffect(() => {
    debouncedValidateForm(formState);
  }, [
    formState.appId,
    formState.userId,
    formState.eventName,
    formState.eventPayload,
    debouncedValidateForm,
  ]);

  const setAppId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const appId = e.currentTarget.value;
    setFormState({
      ...formState,
      appId,
    });
  };

  const setUserId = useDebouncedCallback((userId: string) => {
    setFormState({
      ...formState,
      userId,
    });
  }, DEBOUNCE_TIMEOUT * 2);

  const setEventName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const eventName = e.currentTarget.value;
    setFormState({
      ...formState,
      eventName,
    });
  };



  const setEventPayload = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormState({ ...formState, eventPayload: e.currentTarget.value });
  };

  const onSendEvent = async (e: React.MouseEvent) => {
    e.preventDefault();
    logEvent("Send event", {
      eventName: formState.eventName,
      eventPayload: formState.eventPayload && parse(formState.eventPayload),
    });
    setEngagementHtml("");

    sdk.sendEvent(formState.eventName, parse(formState.eventPayload));
  };

  const renderLogs = () => {
    return logs.map(({ time, message, payload }, index) => (
      <Box
        className={classes.logItem}
        borderBottom={Number(index < logs.length - 1)}
        key={index}
      >
        <Box display="flex" width="100%">
          <Box fontWeight="bold" flexGrow={1}>
            {message}
          </Box>
          <Box>{time}s.</Box>
        </Box>

        {payload ? (
          <Typography component="pre" className={classes.logPayload}>
            {stringify(payload)}
          </Typography>
        ) : null}
      </Box>
    ));
  };

  return (
    <Container component="main" maxWidth="lg">
      <CssBaseline />
      <div className={classes.paper}>
        <form className={classes.form} noValidate>
          <Grid container spacing={6}>
            <Grid item xs={4}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    name="appId"
                    variant="outlined"
                    required
                    fullWidth
                    label="App ID"
                    autoFocus
                    defaultValue={formState.appId}
                    onChange={setAppId}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="userId"
                    variant="outlined"
                    required
                    fullWidth
                    label="User Id"
                    autoFocus
                    defaultValue={formState.userId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserId(e.currentTarget.value)
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="eventName"
                    variant="outlined"
                    required
                    fullWidth
                    label="Event name"
                    autoFocus
                    value={formState.eventName}
                    onChange={setEventName}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    placeholder="Event payload"
                    variant="outlined"
                    fullWidth
                    label="Event payload"
                    multiline
                    rows={20}
                    onChange={setEventPayload}
                    value={formState.eventPayload}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    className={classes.submit}
                    color="primary"
                    onClick={onSendEvent}
                    disabled={!formState.isValid}
                  >
                    Fire event
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid container item xs={8}>
              <Grid item xs={12}>
                <AppBar position="static">
                  <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="simple tabs example"
                  >
                    <Tab label="Default" />
                    <Tab label="Custom (iFrame)" />
                    <Tab label="Custom" />
                  </Tabs>
                </AppBar>
                <TabPanel value={value} index={0}>
                  <fieldset
                    className={`${classes.fieldset} ${classes.engagementPreview}`}
                  >
                    <legend className={classes.fieldsetLegend}>
                      Default placeholder
                    </legend>
                    <Box className={classes.preview}>
                      <div
                        className={classes.engagementPlaceholder}
                        ref={containerForInAppMessages}
                      ></div>
                    </Box>
                  </fieldset>
                </TabPanel>
                <TabPanel value={value} index={1}>
                  <fieldset
                    className={`${classes.fieldset} ${classes.engagementPreview}`}
                  >
                    <legend className={classes.fieldsetLegend}>
                      Custom placeholder <strong>in iFrame</strong>
                    </legend>
                    <Box className={classes.preview}>
                      <Frame className={classes.engagementPlaceholder}>
                        <div
                          dangerouslySetInnerHTML={{ __html: engagementHtml }}
                        ></div>
                      </Frame>
                    </Box>
                  </fieldset>
                </TabPanel>
                <TabPanel value={value} index={2}>
                  <fieldset
                    className={`${classes.fieldset} ${classes.engagementPreview}`}
                  >
                    <legend className={classes.fieldsetLegend}>
                      Custom placeholder
                    </legend>
                    <Box className={classes.preview}>
                      <div
                        dangerouslySetInnerHTML={{ __html: engagementHtml }}
                      ></div>
                    </Box>
                  </fieldset>
                </TabPanel>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} className={classes.logsWrapper}>
            <fieldset className={classes.fieldset}>
              <legend className={classes.fieldsetLegend}>Logs</legend>
              {renderLogs()}
            </fieldset>
          </Grid>
        </form>
      </div>
    </Container>
  );
}

export default App;
