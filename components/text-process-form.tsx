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
import {FormControlLabel, TextField} from "@mui/material";
import {DataTransformStep, DataTransformSteps, DefaultDataTransformStep} from "../interfaces/DataTransformStep";
import Editor, {DiffEditor, useMonaco, loader, EditorProps} from '@monaco-editor/react';

const CodeEditor =({...rest}:EditorProps) => (<Editor
    {...rest}
/>)
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
    const [configs, setConfigs] = React.useState([])
    const [rawData, rawDataInput] = useTextField({
            id:"rawData",label:"Raw data", rows: 4 , defaultValue: defaultRawData
        }
    )
    const { steps,setSteps, addTransform, loadConfigs, showError, showResult} = useCodeTransformPipeline()


    const handleTransformText = ()=>{
        const templateCode = (content) =>`({${content})`
        setResult({})
        const newSteps = [...steps]
        let finalResult:any = rawData
        let hasError = false
        for(let step of newSteps){
            if(hasError){
                step.result = null
                step.error = null
                continue
            }
            step.error = null
            if(step.value){
                try {
                    let code = ts.transpile(templateCode(step.value))
                    let runnalbe :any  = eval(code)
                    finalResult = runnalbe.transform(finalResult)
                    step.result = finalResult
                } catch (e){
                    console.error("error",e)
                    hasError = true
                    step.error = e
                    step.result = null
                }

            }
        }
        setSteps(newSteps)
        if(!hasError){
            setResult(finalResult)
        }
    }
    const handleAddTransform = ()=>{
        addTransform()
    }
    const handleExportTransform=()=>{
        const exportObject = []
        for(let [key, value] of Object.entries(steps)){
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

    const codeChange = (step: DataTransformStep,val)=>{
        const newStep = {...step, value:  val}
        const newSteps = steps.map((element, index)=>{
            if(step.id == element.id){
                return newStep
            }
            return  element
        })
        setSteps(newSteps)
    }
    const enableHandler = (step: DataTransformStep, event: any)=>{
        const newStep = {...step, enable:  event.target.checked}
        const newSteps = steps.map((element, index)=>{
            if(step.id == element.id){
                return newStep
            }
            return  element
        })
        setSteps(newSteps)
    }
    const deleteHandler = (step: DataTransformStep)=>{
        const newSteps = steps.map((element, index)=>{
            if(step.id == element.id){
                return null
            }
            return  element
        }).filter(element =>element!=null)
        setSteps(newSteps)
    }
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
            {steps.map(function(step, i) {
                return <div key={step.id}>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            aria-controls={step.id + "-panel-content"}
                            id={step.id + "-panel-header"}
                        >
                            <Typography>{step.id}</Typography>
                            {!!step.error && <Error sx={{color: red[500]}}/>}

                        </AccordionSummary>
                        <AccordionDetails>
                            <div>
                                <div>
                                    <FormControlLabel control={<Checkbox defaultChecked onChange={(e)=>enableHandler(step, e)}/>}
                                                      label="Enable"/>
                                    <Button variant="contained" onClick={()=>deleteHandler(step)}>Delete</Button>
                                </div>
                                <FormControl fullWidth sx={{m: 1}} variant="filled">
                                    <CodeEditor
                                        defaultLanguage="typescript"
                                        defaultValue={DefaultDataTransformStep.value}
                                        value={step.value}
                                        onChange={e => codeChange(step, e)}
                                        height="200px"
                                    />
                                </FormControl>
                                {step.error &&
                                    <TextField
                                        error
                                        label="Error"
                                        value={step.error.toString()}
                                        multiline
                                        maxRows={4}
                                        fullWidth
                                        disabled
                                        InputLabelProps={{
                                            shrink: true,
                                        }}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />}
                                {!step.error && <JSONEditorReact
                                    json={(step?.result) ? step?.result : ""}
                                    mode={'tree'}
                                    indentation={4}
                                />}
                            </div>
                        </AccordionDetails>
                    </Accordion>

                </div>
            })}
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

function useCodeTransformPipeline() {
    const idPrefix = 'data-transform-step'
    const [steps, setSteps] = React.useState<DataTransformStep[]>([
        {
            ...DefaultDataTransformStep,
            id: `${idPrefix}-1`
        }
    ])
    const [counter, count] = React.useReducer(x => x + 1, 1);

    React.useEffect(()=>{
        const newId = `${idPrefix}-${counter}`
        const exist = steps.some(step=>newId == step.id)
        if(!exist) {
            const newSteps = [... steps]
            newSteps.push({
                ...DefaultDataTransformStep,
                id: newId
            })
            setSteps(newSteps)
        }

    },[counter])
    const addTransform = React.useCallback(()=>{
        count()
    },[counter])


    const loadConfigs= React.useCallback((configs: Array<any>)=>{
        // reset values
        const newSteps: DataTransformStep[] = []
        for(let config of configs){
            const key = config.id
            newSteps.push({
                id: key,
                value: config.value,
                enable: config.enable,
                result: "",
            })
        }
        setSteps(newSteps)
    },[])

    const showError = React.useCallback((id: string, err: any)=>{
        const newSteps: DataTransformStep[] = [... steps]
        const found = newSteps.find(step=>id == step.id)
        if(found){
            found.error = err
            setSteps(newSteps)
        }
    },[steps])
    const showResult = React.useCallback((id: string, result: any)=>{
        const newSteps: DataTransformStep[] = [... steps]
        const found = newSteps.find(step=>id == step.id)
        if(found){
            found.result = result
            setSteps(newSteps)
        }
    },[steps])

    return {steps, setSteps, addTransform,loadConfigs, showError, showResult};
}

export default TextProcessForm
