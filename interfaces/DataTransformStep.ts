import * as React from "react";

export type DataTransformSteps = {
    [key: string]: DataTransformStep
}

export type DataTransformStep = {
    id?: string,
    value?: string,
    enable?: boolean,
    result?: any,
    error?: any,
    deleted?: boolean
}
const defaultCodeText =
`transform: (data: any): any => {
    //Your code to transform here
    const newData = data
    return newData       
}`
export const DefaultDataTransformStep: DataTransformStep ={
    enable: true,
    value: defaultCodeText
}
