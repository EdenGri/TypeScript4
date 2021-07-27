/* 2.1 */

export const MISSING_KEY = '___MISSING___'

type PromisedStore<K, V> = {
    get(key: K): Promise<V>,
    set(key: K, value: V): Promise<void>,
    delete(key: K): Promise<void>
}


export function makePromisedStore<K, V>(): PromisedStore<K, V> {
    const store = new Map<K,V>();
    return {
        get(key: K):Promise<V> {
            return new Promise<V>((resolve, reject)=>{
                const value = store.get(key);
                if(value==undefined){
                    return reject(MISSING_KEY);
                }
                return resolve(value);
            });
        },
        set(key: K, value: V):Promise<void> {
            return new Promise<void>((resolve, reject)=>{
                store.set(key,value);
                return resolve();
            });
        },
        delete(key: K):Promise<void> {
            return new Promise<void>((resolve, reject)=>{
                if(store.delete(key)){
                    return resolve();
                }
                return reject(MISSING_KEY);
            });
        },
    }
}

export function getAll<K, V>(store: PromisedStore<K, V>, keys: K[]): Promise<V[]> {
    return new Promise<V[]> ((resolve,reject) => {
        const promiseList = keys.map((key)=>store.get(key));
        Promise.all(promiseList).then((values) => resolve(values))
                                .catch(() => reject(MISSING_KEY))
    })
}

/*2.2*/
export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
    const store = makePromisedStore<T,R>();
    return async function memo(param:T):Promise<R> {
        try{
            return await store.get(param);
        }catch{
            const ret = f(param);
            store.set(param,ret);
            return ret;
        }    
    }
}

/* 2.3 */
export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: (elem:T) => boolean):()=>Generator<T> {
    return function* (){
        for(let elem of genFn()){
            if(filterFn(elem)){
                yield elem;
            }
        }
    }
}

export function lazyMap<T,R>(genFn: () => Generator<T>, mapFn: (elem:T) => R): ()=>Generator<R> {
    return function* (){
        for(let elem of genFn()){
            yield mapFn(elem);
        }
    }
}

/* 2.4 */
// you can use 'any' in this question

export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((res:any)=>Promise<any>)[]]): Promise<any> {
    if(!fns[0]){ // if there is nothing in the first position        
        return;
    }

    var result = await tryFunction(fns[0],null, 3);
    return await asyncWaterfallWithRetryHelper(fns.slice(1), result);
}

export async function asyncWaterfallWithRetryHelper(fns: ((res:any)=>Promise<any>)[], result:any): Promise<any> { 
    if(!fns[0]){ // if there is nothing in the first position
        return result;   
    }

    var result = await tryFunction(fns[0],result, 3);
    return await asyncWaterfallWithRetryHelper(fns.slice(1), result);        
}

export async function tryFunction(func: (res:any)=>Promise<any>, result:any,tryNumber: number): Promise<any>{
    try{
        var res = await func(result);
        return res;
    }
    catch(err){
        if (tryNumber == 0){            
            throw err;
        }
        await timeoutAsync(2000);        
        return await tryFunction(func, result,tryNumber - 1);
    }

}

function timeoutAsync(ms : number) : Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
