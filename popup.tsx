import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Grid from "@mui/material/Unstable_Grid2"
import MenuItem from '@mui/material/MenuItem';
import { useState } from "react"

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <Box sx={{ padding: "14px", minWidth: 600 }}>
      <Grid container spacing={1} alignItems="center">
        <Grid xs={4}>
          <span className="type-title">Protocol</span>
        </Grid>
        <Grid xs={8}>
          <TextField
            id="sroptocalSelect"
            variant="standard"
            size="small"
            select
            fullWidth 
          >
            <MenuItem key="https" value="https">https</MenuItem>
            <MenuItem key="http" value="http">http</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <Button variant="contained" size="small">
        Open
      </Button>
    </Box>
  )
}

export default IndexPopup
