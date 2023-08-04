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

export const DefaultDataTransformStep: DataTransformStep ={
    enable: true,
    value: ""
}
