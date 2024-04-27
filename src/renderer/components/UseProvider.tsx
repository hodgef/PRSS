import React, { FC, ReactNode, createContext, useContext } from "react";
import { storeInt } from "../../common/bootstrap";

const contextJson = storeInt.get("contextMap");
const contextMap = contextJson ? JSON.parse(contextJson) : {};
const Context = createContext(contextMap);

export const Provider: FC<{ children: ReactNode }> = ({ children }) => {
    if(new Blob([contextJson]).size > 3000000){
        storeInt.set("contextMap", {});
    }
    return <Context.Provider value={contextMap}>{children}</Context.Provider>;
}

export const useProvider = <T,>(key: string) => {
    const context = useContext(Context);
    return {
        set value(v: T) {
            context[key] = v;
        },
        get value() {
            if (!context[key]) {
                console.warn(`contextMap: Key '${key}' Not Found!`);
                return null;
            }
            return context[key] as T;
        }
    }
};

export const usePersist = <T,>(key: string) => {
    const context = useContext(Context);
    return {
        set value(v: T) {
            context[key] = v;
            const json = JSON.stringify(contextMap);
            storeInt.set("contextMap", json);
        },
        get value() {
            if (!context[key]) {
                console.warn(`contextMap: Key '${key}' Not Found!`);
                return null;
            }
            return context[key] as T;
        }
    }
};