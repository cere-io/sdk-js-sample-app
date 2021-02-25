import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import Frame from "react-frame-component";
import { pipe } from "ramda";

import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Button,
  CssBaseline,
  Container,
  Grid,
  TextField,
  Typography,
} from "@material-ui/core";

declare global {
  interface Window {
    cereSDK: any;
  }
}

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
  eventName: string;
  eventPayload: string;
  isValid: boolean;
};

const useStyles = makeStyles((theme) => ({
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

const cereSDK = window.cereSDK;
const DEBOUNCE_TIMEOUT = 500;
let appLogs: Array<LogMessage> = [];

const stringify = (json: Payload) => JSON.stringify(json, null, 2);
const parse = (value: string) =>
  JSON.parse(value.replace(/\s+(\w+):\s+/g, '"$1":').replace(/,\s+}/, "}"));

const getUserCredentials = (userId?: string) => {
  const credentials = userId && localStorage.getItem(userId);
  return credentials ? parse(credentials) : {};
};

const setAppLogs = (newLogs: Array<LogMessage>) => (appLogs = newLogs);

const logEvent = (message: string, payload?: Payload) => {
  setAppLogs([
    { time: (performance.now() / 1000).toFixed(3), message, payload },
    ...appLogs,
  ]);
};

function App() {
  const classes = useStyles();

  const [formState, setFormState] = useState({
    appId: process.env.REACT_APP_ID || "",
    eventName: "",
    eventPayload: stringify({}),
    isValid: false,
  });

  const [engagementHtml, setEngagementHtml] = useState("");

  const containerForInAppMessages = useRef<HTMLDivElement>(null);

  const debouncedInitSDK = useDebouncedCallback(async (appId: string) => {
    logEvent("Init SDK", { appId });
    await cereSDK.init(
      appId,
      process.env.REACT_APP_USER_ID,
      containerForInAppMessages.current,
      process.env.REACT_APP_API_KEY
    );
    logEvent(
      "User credentials",
      getUserCredentials(process.env.REACT_APP_USER_ID)
    );
  }, DEBOUNCE_TIMEOUT);

  const debouncedValidateForm = useDebouncedCallback((formState: FormState) => {
    let eventPayload = formState.eventPayload;
    let isValid = Boolean(formState.appId) && Boolean(formState.eventName);

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
    if (formState.appId) {
      debouncedInitSDK.callback(formState.appId);
    }
  }, [formState.appId, debouncedInitSDK]);

  useEffect(() => {
    cereSDK.onEngagement((template: string) => {
      logEvent("Engagement", { template });
      setEngagementHtml(template);
    });
  }, []);

  useEffect(() => {
    debouncedValidateForm.callback(formState);
  }, [formState, debouncedValidateForm]);

  const setAppId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const appId = e.currentTarget.value;

    setFormState({
      ...formState,
      appId,
    });
  };

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

  const sendEvent = async (e: React.MouseEvent) => {
    e.preventDefault();
    logEvent("Send event", {
      eventName: formState.eventName,
      eventPayload: formState.eventPayload && parse(formState.eventPayload),
    });
    setEngagementHtml("");
    await cereSDK.sendEvent(formState.eventName, formState.eventPayload);
  };

  const renderLogs = () => {
    return appLogs.map(({ time, message, payload }, index) => (
      <Box
        className={classes.logItem}
        borderBottom={Number(index < appLogs.length - 1)}
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
                    value={formState.appId}
                    onChange={setAppId}
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
                    onClick={sendEvent}
                    disabled={!formState.isValid}
                  >
                    Fire event
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid container item xs={8}>
              <Grid item xs={12}>
                <fieldset
                  className={`${classes.fieldset} ${classes.engagementPreview}`}
                >
                  <legend className={classes.fieldsetLegend}>
                    Engagement preview
                  </legend>
                  <Box className={classes.preview}>
                    <Frame className={classes.frame}>
                      <div
                        ref={containerForInAppMessages}
                        dangerouslySetInnerHTML={{ __html: engagementHtml }}
                      ></div>
                    </Frame>
                  </Box>
                </fieldset>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
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
