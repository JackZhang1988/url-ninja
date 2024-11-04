import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import SelectAllRoundedIcon from "@mui/icons-material/SelectAllRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import TabUnselectedRoundedIcon from "@mui/icons-material/TabUnselectedRounded";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Unstable_Grid2";
import React, { useEffect, useState } from "react";

import "./index.less";

import Snackbar from "@mui/material/Snackbar";

const STORAGE_KEY = "QUERY_OPTS";

function copy(text) {
  const ta = document.createElement("textarea");
  ta.style.cssText = "opacity:0; position:fixed; width:1px; height:1px; top:0; left:0;";
  ta.value = text;
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

interface IUrlInfo extends Partial<URL> {
  protocol: string;
}

interface IQueryOpt {
  key: string;
  values: string[];
}

let curTabInfo = {} as chrome.tabs.Tab;

function getUrlInfo(url) {
  const urlInfo = new URL(url);
  console.log("url info", urlInfo);

  return {
    hash: urlInfo.hash,
    protocol: urlInfo.protocol.slice(0, -1),
    port: urlInfo.port,
    host: urlInfo.host,
    href: urlInfo.href,
    hostname: urlInfo.hostname,
    search: urlInfo.search,
    searchParams: urlInfo.searchParams,
    pathname: urlInfo.pathname
  };
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let allTab = await chrome.tabs.query(queryOptions);
  // TODO: 127.0.0.1 won't return url in Edge browser
  curTabInfo = allTab[0];
  if (!curTabInfo) {
    let allTab = await chrome.tabs.query({ active: true, lastFocusedWindow: false });
    curTabInfo = allTab[0];
  }
  return curTabInfo;
}

interface IUrlItemProps {
  title: string;
}

function UrlItem(props: React.PropsWithChildren<IUrlItemProps>) {
  return (
    <>
      <Grid xs={2}>
        <span className="item-title">{props.title}:</span>
      </Grid>
      <Grid xs={10}>{props.children}</Grid>
    </>
  );
}

interface IQueryItem {
  key: string;
  value: string;
  checked: boolean;
}

function IndexPopup() {
  const [queryItems, setQueryItems] = useState<IQueryItem[]>([{ key: "", value: "", checked: true }]);

  const [urlInfo, setUrlInfo] = useState<IUrlInfo>({
    protocol: "https",
    hostname: "",
    port: "",
    pathname: ""
  });

  const [tempQueryOpts, setTempQueryOpts] = useState<IQueryOpt[]>([]);

  const [storageQueryOpts, setStorageQueryOpts] = useState<IQueryOpt[]>([]);

  const [settingOpen, setSettingOpen] = useState(false);

  const [clearCacheSuccess, setClearCacheSuccess] = useState(false);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  useEffect(() => {
    const init = async () => {
      let tab = await getCurrentTab();
      const urlInfo = getUrlInfo(tab.url);
      setUrlInfo(urlInfo);
      try {
        chrome.storage.local.get(STORAGE_KEY, (result) => {
          if (result[STORAGE_KEY]) {
            console.log("init query opts", result[STORAGE_KEY]);
            const list = JSON.parse(result[STORAGE_KEY]) || [];
            setTempQueryOpts(list);
            setStorageQueryOpts(list);
          }
        });
      } catch (error) {}
      const queryItems = [] as IQueryItem[];
      urlInfo.searchParams.forEach((value, key) => {
        queryItems.push({
          key,
          value,
          checked: true
        });
      });
      if (queryItems.length) {
        setQueryItems(queryItems);
      }
    };

    init().catch(console.error);
  }, []);

  const saveTempQueryOpts = (key: string, value: string) => {
    if (!key) return;
    const target = tempQueryOpts.find((q) => q.key === key);
    if (target) {
      if (value && !target.values.includes(value)) {
        target.values.push(value);
        setTempQueryOpts([...tempQueryOpts]);
      }
    } else {
      tempQueryOpts.push({ key, values: [value] });
      setTempQueryOpts([...tempQueryOpts]);
    }
  };

  const saveQueryOpts = (newQuerysOpts?: IQueryOpt[]) => {
    try {
      const queryOpts = newQuerysOpts || tempQueryOpts;
      chrome.storage.local.set({ [STORAGE_KEY]: JSON.stringify(queryOpts) }).then(() => {
        setStorageQueryOpts(queryOpts);
        console.log("Value is set to " + JSON.stringify(queryOpts));
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (key: string, index: number, value: string | boolean, event: React.SyntheticEvent) => {
    const changedItem = queryItems[index];
    if (key === "checked") {
      saveTempQueryOpts(changedItem.key, changedItem.value);
    }
    setQueryItems(
      queryItems.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [key]: value
            }
          : item
      )
    );
  };

  const handleAddQuery = () => {
    setQueryItems([...queryItems, { key: "", value: "", checked: true }]);
  };

  const handleCopyQuery = () => {
    const query = queryItems
      .filter((q) => q.checked)
      .reduce((pre: string, cur) => {
        return `${pre ? pre + "&" : pre}` + `${cur.key}=${cur.value}`;
      }, "");
    copy(query);
  };

  const handleSelectAllQuery = () => {
    setQueryItems(
      queryItems.map((item) => ({
        ...item,
        checked: true
      }))
    );
  };

  const handleUnselectAllQuery = () => {
    setQueryItems(
      queryItems.map((item) => ({
        ...item,
        checked: !item.checked
      }))
    );
  };

  const handleUrlInfoChange = (type, value) => {
    setUrlInfo({
      ...urlInfo,
      [type]: value
    });
  };

  const buildNewUrl = () => {
    let url = `${urlInfo.protocol}://${urlInfo.hostname}${urlInfo.port ? `:${urlInfo.port}` : ""}${urlInfo.pathname}`;
    const query = queryItems
      .filter((q) => q.checked)
      .reduce((pre: string, cur) => {
        return `${pre ? pre + "&" : pre}` + `${cur.key}=${cur.value}`;
      }, "");

    return url + `${query ? "?" + query : ""}` + `${urlInfo.hash ? "#" + urlInfo.hash : ""}`;
  };

  const openUrl = () => {
    saveQueryOpts();
    const url = buildNewUrl();
    chrome.tabs.create({ url, selected: true, active: true });
  };

  const copyUrl = () => {
    saveQueryOpts();
    const url = buildNewUrl();
    copy(url);
  };

  const replaceCurUrl = () => {
    saveQueryOpts();
    const url = buildNewUrl();
    chrome.tabs.update(curTabInfo.id, { url });
  };

  const handleQueryBlur = (type: "key" | "value", value: string, index: number) => {
    if (type === "key") {
      saveTempQueryOpts(value, "");
    } else {
      const key = queryItems[index].key;
      saveTempQueryOpts(key, value);
    }
  };

  const triggerSetting = (open: boolean) => {
    setSettingOpen(open);
  };

  const queryKeyOpts = tempQueryOpts.map((q) => q.key);
  const getQueryValueOpts = (key: string) => {
    const target = tempQueryOpts.find((q) => q.key === key);
    return target?.values || [];
  };

  const handleDelOptionCache = (e, key: string) => {
    e.stopPropagation();
    e.preventDefault();
    const newOpts = tempQueryOpts.filter((q) => q.key !== key);
    setTempQueryOpts(() => [...newOpts]);
    saveQueryOpts(newOpts);
  };

  const clearAllQueryOptCache = () => {
    chrome.storage.local.remove(STORAGE_KEY, () => {
      setClearCacheSuccess(true);
      setStorageQueryOpts([]);
    });
    setAnchorEl(null);
  };

  const openClearPopover = Boolean(anchorEl);

  const handleClearPopoverClose = () => {
    setAnchorEl(null);
  };

  const triggerClearPopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  return (
    <Box sx={{ padding: "14px", minWidth: 600, pb: "10px" }}>
      <Drawer anchor="right" open={settingOpen} onClose={() => triggerSetting(false)}>
        <Box sx={{ padding: "10px", minWidth: "80vw" }}>
          <Button
            sx={{ position: "absolute", right: "10px", top: "20px" }}
            startIcon={<DeleteIcon />}
            variant="contained"
            color="error"
            size="small"
            onClick={triggerClearPopover}>
            Clear All
          </Button>
          <Popover
            open={openClearPopover}
            anchorEl={anchorEl}
            onClose={handleClearPopoverClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center"
            }}>
            <Box sx={{ p: 1 }}>
              <h3>Are you sure to clear all query options cache?</h3>
              <Button
                sx={{ padding: "1px 2px", fontSize: "12px", marginRight: "6px" }}
                variant="outlined"
                size="small"
                onClick={handleClearPopoverClose}>
                Cancel
              </Button>
              <Button
                sx={{ padding: "1px 2px", fontSize: "12px" }}
                variant="contained"
                size="small"
                onClick={clearAllQueryOptCache}>
                OK
              </Button>
            </Box>
          </Popover>
          <Snackbar
            open={clearCacheSuccess}
            autoHideDuration={3000}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}>
            <Alert severity="success">All query options cache cleared!</Alert>
          </Snackbar>
          <h2>Current Storaged Query:</h2>
          <List className="storage-list" dense>
            <ListItem className="storage-list-item">
              <span className="item-key">Key</span>
              {/* <span className="item-value">Values</span> */}
              <span className="item-action">Action</span>
            </ListItem>
            {storageQueryOpts.map((q, index) => (
              <ListItem key={q.key} className="storage-list-item">
                <span className="item-key">{q.key}</span>
                {/* <span className="item-value">{q.values.join(', ')}</span> */}
                <IconButton
                  className="item-action"
                  aria-label="delete"
                  color="error"
                  onClick={(e) => handleDelOptionCache(e, q.key)}>
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Tooltip title="Settings" arrow>
        <IconButton aria-label="settings" color="primary" onClick={() => triggerSetting(true)} className="setting-icon">
          <SettingsRoundedIcon />
        </IconButton>
      </Tooltip>
      <Grid container spacing={0} alignItems="center" rowSpacing={1}>
        <UrlItem title="Protocal">
          <TextField
            id="protocalSelect"
            variant="outlined"
            size="small"
            select
            value={urlInfo.protocol}
            onChange={(e) => handleUrlInfoChange("protocol", e.target.value)}>
            <MenuItem key="https" value="https">
              https
            </MenuItem>
            <MenuItem key="http" value="http">
              http
            </MenuItem>
          </TextField>
        </UrlItem>
        <UrlItem title="Hostname">
          <TextField
            variant="outlined"
            fullWidth
            size="small"
            value={urlInfo.hostname}
            onChange={(e) => handleUrlInfoChange("hostname", e.target.value)}></TextField>
        </UrlItem>
        <UrlItem title="Port">
          <TextField
            variant="outlined"
            fullWidth
            size="small"
            type="number"
            value={urlInfo.port}
            onChange={(e) => handleUrlInfoChange("port", e.target.value)}></TextField>
        </UrlItem>
        <UrlItem title="Path">
          <TextField
            variant="outlined"
            fullWidth
            size="small"
            value={urlInfo.pathname}
            onChange={(e) => handleUrlInfoChange("pathname", e.target.value)}></TextField>
        </UrlItem>
      </Grid>
      <Divider textAlign="left" sx={{ mt: "10px", mb: "10px" }}>
        <span className="divider-text">Queries:</span>
      </Divider>
      {/* <Button sx={{ml: '5px'}} variant="outlined" size="small" endIcon={<AddIcon />}>New Params</Button> */}
      <Box sx={{ mb: "10px" }}>
        {queryItems.map((item: IQueryItem, index: number) => (
          <div className="query-item" key={index}>
            <Checkbox
              size="small"
              checked={item.checked}
              onChange={(e) => handleChange("checked", index, e.target.checked, e)}
            />
            <Autocomplete
              freeSolo
              options={queryKeyOpts}
              sx={{ flex: 1, minWidth: '300px' }}
              componentsProps={{
                paper: {
                  sx: {
                    wordBreak: "break-word"
                    }
                  }
              }}
              value={item.key}
              onInputChange={(e, value) => handleChange("key", index, value, e)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  className="param-input"
                  size="small"
                  onBlur={(e) => handleQueryBlur("key", e.target.value, index)}></TextField>
              )}
              // renderOption={(props, option) => (
              //   <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between !important' }}>
              //     <span>{option}</span>
              //     <CloseIcon fontSize="small" sx={{ color: '#8e8e8e'}} onClick={(e) => handleDelOptionCache(e, option)}/>
              //   </Box>
              // )}
            />
            <span className="item-label">=</span>
            <Autocomplete
              freeSolo
              options={getQueryValueOpts(item.key)}
              sx={{ width: '300px' }}
              componentsProps={{
                paper: {
                  sx: {
                    wordBreak: "break-word"
                    }
                  }
              }}
              value={item.value}
              onInputChange={(e, value) => handleChange("value", index, value, e)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  className="param-input"
                  size="small"
                  onBlur={(e) => handleQueryBlur("value", e.target.value, index)}></TextField>
              )}
            />
          </div>
        ))}
      </Box>
      <Tooltip title="Add new query" arrow>
        <IconButton aria-label="add" color="primary" onClick={handleAddQuery}>
          <AddBoxRoundedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy selected query" arrow>
        <IconButton aria-label="copy" color="primary" onClick={handleCopyQuery}>
          <ContentCopyRoundedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Select all query" arrow>
        <IconButton aria-label="copy" color="primary" onClick={handleSelectAllQuery}>
          <SelectAllRoundedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Unselect query" arrow>
        <IconButton aria-label="copy" color="primary" onClick={handleUnselectAllQuery}>
          <TabUnselectedRoundedIcon />
        </IconButton>
      </Tooltip>
      <Divider textAlign="left" sx={{ mt: "10px", mb: "10px" }}>
        <span className="divider-text">Hash:</span>
      </Divider>
      <div className="hash-item">
        <Switch defaultChecked size="small" />
        <span className="item-label">=</span>
        <TextField
          className="value-input"
          size="small"
          multiline
          value={decodeURIComponent(urlInfo.hash)}
          onChange={(e) => handleUrlInfoChange("hash", e.target.value)}></TextField>
      </div>
      <Box sx={{ mt: "10px" }}>
        <Button variant="contained" size="small" onClick={openUrl}>
          Open
        </Button>
        <Button variant="outlined" size="small" style={{ marginLeft: "5px" }} onClick={copyUrl}>
          Copy Url
        </Button>
        <Button variant="outlined" size="small" style={{ marginLeft: "5px" }} onClick={replaceCurUrl}>
          Replace Current
        </Button>
      </Box>
    </Box>
  );
}

export default IndexPopup;
