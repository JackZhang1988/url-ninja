import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded';
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import Divider from "@mui/material/Divider"
import IconButton from "@mui/material/IconButton"
import MenuItem from "@mui/material/MenuItem"
import Switch from "@mui/material/Switch"
import TextField from "@mui/material/TextField"
import Grid from "@mui/material/Unstable_Grid2"
import React, { useEffect, useState } from "react"

import "./index.less"

interface IUrlInfo extends Partial<URL> {
  protocol: string;
}

function getUrlInfo(url) {
  const urlInfo = new URL(url);
  console.log('url info', urlInfo);

  return {
    hash: urlInfo.hash,
    protocol: urlInfo.protocol.slice(0, -1),
    host: urlInfo.host,
    href: urlInfo.href,
    hostname: urlInfo.hostname,
    search: urlInfo.search,
    searchParams: urlInfo.searchParams,
    pathname: urlInfo.pathname,
  }
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  // TODO: 127.0.0.1 won't return url in Edge browser
  return tab;
}

interface IUrlItemProps {
  title: string
}

function UrlItem(props: React.PropsWithChildren<IUrlItemProps>) {
  return (
    <>
      <Grid xs={2}>
        <span className="item-title">{props.title}:</span>
      </Grid>
      <Grid xs={10}>{props.children}</Grid>
    </>
  )
}


interface IQueryItem {
  key: string
  value: string
  checked: boolean
}

function IndexPopup() {
  const [queryItems, setQueryItems] = useState<IQueryItem[]>([{ key: "", value: "", checked: true }])

  const [urlInfo, setUrlInfo] = useState<IUrlInfo>({
    protocol: 'https',
  });

  useEffect(() => {
    const init = async () => {
      const tab = await getCurrentTab();
      const urlInfo = getUrlInfo(tab.url);
      setUrlInfo(urlInfo);
      const queryItems = [] as IQueryItem[];
      urlInfo.searchParams.forEach((value, key) => {
        queryItems.push({
          key,
          value,
          checked: true
        })
      })
      if(queryItems.length) {
        setQueryItems(queryItems)
      }
    }

    init().catch(console.error);
  });

  const handleChange = (key: string, index: number, value: string | boolean) => {
    setQueryItems(
      queryItems.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [key]: value
            }
          : item
      )
    )
  }

  const handleAddQuery = () => {
    setQueryItems([...queryItems, { key: "", value: "", checked: true }])
  }

  return (
    <Box sx={{ padding: "14px", minWidth: 600, pb: "10px" }}>
      <Grid container spacing={0} alignItems="center" rowSpacing={1}>
        <UrlItem title="Protocal">
          <TextField id="protocalSelect" variant="outlined" size="small" select value={urlInfo.protocol}>
            <MenuItem key="https" value="https">
              https
            </MenuItem>
            <MenuItem key="http" value="http">
              http
            </MenuItem>
          </TextField>
        </UrlItem>
        <UrlItem title="Hostname">
          <TextField variant="outlined" fullWidth size="small" value={urlInfo.hostname}></TextField>
        </UrlItem>
        <UrlItem title="Port">
          <TextField variant="outlined" fullWidth size="small" type="number" value={urlInfo.port}></TextField>
        </UrlItem>
        <UrlItem title="Path">
          <TextField variant="outlined" fullWidth size="small" value={urlInfo.pathname}></TextField>
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
              onChange={(e) => handleChange("checked", index, e.target.checked)}
            />
            <TextField
              className="param-input"
              size="small"
              value={item.key}
              onChange={(e) => handleChange("key", index, e.target.value)}></TextField>
            <span className="item-label">=</span>
            <TextField
              className="value-input"
              size="small"
              multiline
              value={item.value}
              onChange={(e) => handleChange("value", index, e.target.value)}></TextField>
          </div>
        ))}
      </Box>
      <IconButton aria-label="add" color="primary" onClick={handleAddQuery}>
        <AddBoxRoundedIcon />
      </IconButton>
      <Divider textAlign="left" sx={{ mt: "10px", mb: "10px" }}>
        <span className="divider-text">Hash:</span>
      </Divider>
      <div className="hash-item">
        <Switch defaultChecked size="small" />
        <span className="item-label">=</span>
        <TextField className="value-input" size="small" multiline value={decodeURIComponent(urlInfo.hash)}></TextField>
      </div>
      <Box sx={{ mt: "10px" }}>
        <Button variant="contained" size="small">
          Open
        </Button>
      </Box>
    </Box>
  )
}

export default IndexPopup
