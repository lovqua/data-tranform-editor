import * as React from "react";

export type DataTransformStep = {
    [key: string]: {
        id: string,
        value?: string,
        enable?: boolean,
        el?: React.JSX.Element ,
        result?: any,
        error?: any,
        render?: Function
    }
}
