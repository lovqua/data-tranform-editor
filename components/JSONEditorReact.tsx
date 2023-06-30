import  * as React from 'react';

import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';


const JSONEditorReact =(props: any)=>{
    const options: any = Object.assign({}, props);
    delete options.json
    delete options.text
    let container = React.useRef(null)
    let jsoneditor =  React.useRef(null)

    React.useEffect(() => {
        if(jsoneditor.current==null){
            jsoneditor.current = new JSONEditor(container.current, options)
            if ('json' in props) {
                jsoneditor.current.set(props.json)
            }
            if ('text' in props) {
                jsoneditor.current.setText(props.text)
            }
            if ('mode' in props) {
                jsoneditor.current.setMode(props.mode);
            }
        }

    }, []);

    React.useEffect(() => {
        if(jsoneditor.current && props.json){
            jsoneditor.current.update(props.json)
        }

    }, [props.json]);

    React.useEffect(() => {
        if (jsoneditor && props.text){
            jsoneditor.current.updateText(props.text)
        }
    }, [props.text]);


    return (
        <div className="jsoneditor-react-container" ref={container} />
    );
}

export default JSONEditorReact;