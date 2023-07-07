import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FilledInput from '@mui/material/FilledInput';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { styled } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import dynamic from "next/dynamic";
import "@uiw/react-textarea-code-editor/dist.css";
import * as ts from "typescript";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Error } from '@mui/icons-material';
import { red } from '@mui/material/colors';
import { FilePond } from 'react-filepond'
import Checkbox from '@mui/material/Checkbox';
import "filepond/dist/filepond.min.css";
import {FormControlLabel} from "@mui/material";
import {DataTransformStep} from "../interfaces/DataTransformStep";
const CodeEditor = dynamic(
    () => import("@monaco-editor/react").then((mod) => mod.default),
    { ssr: false }
)
const JSONEditorReact = dynamic(
    () => import("./JSONEditorReact").then((mod) => mod.default),
    { ssr: false }
)


const StyledDiv = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
}));
type Props = {
    defaultRawData?: string
}
const TextProcessForm = ({ defaultRawData }: Props) => {
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const [result, setResult] = React.useState({})
    const [configs, setConfigs] = React.useState({})
    const [rawData, rawDataInput] = useTextField({
            id:"rawData",label:"Raw data", rows: 4 , defaultValue: defaultRawData
        }
    )
    const [tranformSteps, addTransform, updateResults, loadConfigs] = useCodeTransformPipeline()
    const transformInputs = []
    for(let [, value] of Object.entries(tranformSteps)){
        transformInputs.push(value.el)
    }

    const handleTransformText = ()=>{
        const templateCode = (content) =>`({
            transform: (data: any): any => {
                ${content}
            })`
        setResult({})
        let finalResult:any = rawData
        let hasError = false
        for(let [, value] of Object.entries(tranformSteps)){
            if(hasError){
                value.result = null
                value.error = null
                continue
            }
            value.error = null
            if(value.value){
                try {
                    let code = ts.transpile(templateCode(value.value))
                    let runnalbe :any  = eval(code)
                    finalResult = runnalbe.transform(finalResult)
                    value.result = finalResult
                } catch (e){
                    console.error("error",e)
                    hasError = true
                    value.error = e
                    value.result = null
                }

            }
        }
        if(!hasError){
            setResult(finalResult)
        }
        updateResults()
        forceUpdate()
    }
    const handleAddTransform = ()=>{
        addTransform()
    }
    const handleExportTransform=()=>{
        const exportObject = []
        for(let [key, value] of Object.entries(tranformSteps)){
            exportObject.push({
                id: value.id,
                value: value.value,
                enable: value.enable
            })
        }
        const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
            JSON.stringify(exportObject)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = "config.json";
        link.click();
    }
    const handleImportTransform=(fileItems)=>{
        if(fileItems && fileItems.length>0){
            const file = fileItems[0].file
            const fileReader = new FileReader();
            fileReader.readAsText(file, "UTF-8");
            fileReader.onload = e => {
                setConfigs(JSON.parse(e.target.result.toString()))
            };
        }

    }

    React.useEffect(()=>{
        if(Object.keys(configs).length){
            loadConfigs(configs)
        }

    },[configs])
    return (
        <Box
            component="form"
            sx={{
                '& > :not(style)': { m: 1 },
            }}
            noValidate
            autoComplete="off"
        >
            <StyledDiv> Data transform</StyledDiv>
            {rawDataInput}
            {transformInputs}
            <div>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" onClick={handleAddTransform}>Add transform</Button>
                    <Button variant="outlined" onClick={handleTransformText}>Process</Button>
                </Stack>
            </div>
            <div>
                <Stack direction="row" spacing={2}>
                    <Button variant="outlined" onClick={handleExportTransform}>Export config</Button>
                    <FilePond
                        onupdatefiles={handleImportTransform}
                        allowMultiple={false}
                        name="files" /* sets the file input name, it's filepond by default */
                        labelIdle='Upload config file'
                    />

                </Stack>
            </div>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={"final-result-panel-content"}
                    id={"final-result-panel-header"}
                >
                    <Typography>Final Result</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <JSONEditorReact
                        json={result? result : ""}
                        mode={'tree'}
                        indentation={4}
                    />
                </AccordionDetails>
            </Accordion>
            <StyledDiv>
                { (result as any)?.html}
            </StyledDiv>
        </Box>
    )
}

function useTextField({ id ,type = "text", label, rows=0, defaultValue= "" }): [string, React.JSX.Element] {
    const [value, setValue] = React.useState(defaultValue);
    const input =  (
        <div key={id}>
            <FormControl fullWidth sx={{ m: 1 }} variant="filled" >
                <InputLabel htmlFor={id}>{label}</InputLabel>
                <FilledInput
                    type={type}
                    id={id}
                    multiline={rows>0}
                    rows={rows>1?rows:1}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
            </FormControl>
        </div>
    );
    return [value, input];
}

function useCodeTransformPipeline(): [DataTransformStep,Function, Function,Function] {
    const [valueCounter, setValueCounter] = React.useState(1)
    const [values, setValues] = React.useState( {} as DataTransformStep)
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const intKeys = new Set<string>()
    const [keys, setKeys] = React.useState(intKeys)


    const buildElement = (key: string)=>{
        const buildInputEl =(key: string) => {
            const valueChange = (val)=>{
                values[key].value = val
            }
            return (
                <FormControl fullWidth sx={{ m: 1 }} variant="filled" >
                    <CodeEditor 
                        defaultLanguage="typescript" 
                        defaultValue="//Please enter TS code."
                        id={key}
                        value={values[key].value}
                        onChange={e => valueChange(e)}
                        height="200px"
                    />
                </FormControl>
            )
        }

        const buildEnableEl = (key: string)=> {
            const enableHandler = (event: any)=>{
                values[key].enable = event.target.checked
            }
            console.log("buildEnableEl.enable",values[key].enable)
            return <FormControlLabel control={<Checkbox defaultChecked onChange={enableHandler} />} label="Enable" />
        }

        const buildDeleteEl = (key: string)=> {
            const deleteHandler = ()=>{
                delete values[key]
                forceUpdate()
            }
            return <Button variant="contained" onClick={deleteHandler}>Delete</Button>
        }

        const transformResult =(key) =>(
            <JSONEditorReact
                json={ (values[key]?.result) ? values[key]?.result : ""}
                mode={'tree'}
                indentation={4}
            />
        )

        const buildErrorEl = (key: string)=>{
            return (
                <CodeEditor
                    id={"transform-error-"+key}
                    language="typescript"
                    rows={10}
                    data-color-mode="dark"
                    value={values[key].error.toString()}
                    style={{
                        fontSize: 12,
                        backgroundColor: "#f5f5f5",
                        fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                    }}
                    padding={15}
                />)
        }
        return (
            <div key={key}>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={key+"-panel-content"}
                        id={key+"-panel-header"}
                    >
                        <Typography>{key}</Typography>
                        {!!values[key].error && <Error  sx={{ color: red[500] }}/>}

                    </AccordionSummary>
                    <AccordionDetails>
                        <div>
                            <div>
                                {buildEnableEl(key)}
                                {buildDeleteEl(key)}
                            </div>
                            {buildInputEl(key)}
                            {values[key].error? buildErrorEl(key) : transformResult(key)}
                        </div>
                    </AccordionDetails>
                </Accordion>

            </div>
        )
    }






    function valueRender (){
       /* this.inputEl = buildInputEl(this.id)
        this.enableEl = buildEnableEl(this.id)
        this.resultEl = transformResult(this.id)
        if(this.error){
            this.errorEl = buildErrorEl(this.id)
        } else {
            this.errorEl = null
        }*/
        this.el = buildElement(this.id)
    }
    const updateResults = ()=>{
        keys.forEach((key)=>{
            values[key].render()
        })
        forceUpdate()
    }

    keys.forEach((key)=>{
        if(!values[key]){
            values[key]={
                id: key,
                value: "",
                enable: true,
                result: "",
                el: null,
                render: valueRender
            }
            values[key].render()
        }
    })

    const addTransform = React.useCallback(()=>{
        setValueCounter(valueCounter+1)
    },[valueCounter])

    React.useEffect(()=>{
        if(valueCounter>0){
            const key ="transform-"+valueCounter
            if(!keys.has(key)){
                keys.add(key)
            }
            forceUpdate()
        }
    },[valueCounter])

    const loadConfigs= React.useCallback((configs: Array<any>)=>{
        // reset values
        for (let member in values) {
            delete values[member];
        }
        keys.clear()

        const newCounter = configs.length
        for(let config of configs){
            const key = config.id
            keys.add(key)
            values[key]={
                id: key,
                value: config.value,
                enable: config.enable,
                result: "",
                el: null,
                render: valueRender
            }
            values[key].render()
        }
        setValueCounter(newCounter)
    },[])

    return [values,addTransform,updateResults,loadConfigs];
}

export default TextProcessForm
