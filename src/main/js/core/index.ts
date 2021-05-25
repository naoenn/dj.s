import React from 'react';

const storeMap: Map<
  ydj.Store<any> | (new () => ydj.Store<any>),
  ydj.Store<any>
> = new Map();

export const addStore = <T>(
  storeClass: (new () => ydj.Store<T>) | ydj.Store<T>,
  setState: React.Dispatch<React.SetStateAction<T | undefined | null>>,
  init?: T | null
) => {
  let value: ydj.Store<T> | undefined = storeMap.get(storeClass);

  if (!value) {
    if (typeof storeClass !== 'function') {
      value = storeClass;
    } else {
      value = new storeClass();
    }

    storeMap.set(storeClass, value);

    setActionMap(value, setState);

    if (!value.initialized) {
      const result = value.init?.();
      if (result) {
        return result.then(() => {
          if (value) {
            if (init !== undefined && value.state === undefined)
              value.state = init;
            value.initialized = true;
          }
          return value?.state;
        });
      } else {
        if (init !== undefined && value.state === undefined) value.state = init;
        value.initialized = true;
        return value.state;
      }
    }
  }
  return value.state;
};

export const getStore = <T>(
  storeClass: (new () => ydj.Store<T>) | ydj.Store<T>
) => {
  return storeMap.get(storeClass);
};

const actionMap: ydj.ActionMap = {};

const setActionMap = <T>(
  store: ydj.Store<T>,
  setState: React.Dispatch<React.SetStateAction<T | undefined | null>>
) => {
  for (let action in store.actions) {
    if (!actionMap[action]) {
      actionMap[action] = {
        store,
        setStates: [],
      };
    }
    const { store: target, setStates } = actionMap[action];

    if (store !== target) {
      throw new Error('store actions conflict');
    }

    if (!setStates.includes(setState)) {
      setStates.push(setState);
    }
  }
};

export const removeStore = <T>(
  store: ydj.Store<T>,
  setState: React.Dispatch<React.SetStateAction<T | undefined | null>>
) => {
  Object.keys(store.actions).forEach((action) => {
    const { store: target, setStates } = actionMap[action];
    if (store === target) {
      const newSetStates = setStates.filter((sState) => sState !== setState);
      actionMap[action].setStates = newSetStates;
    }
  });
};

const setStatesFn = <T>(
  setStates: React.Dispatch<React.SetStateAction<T | undefined | null>>[],
  state: any
) => {
  setStates.forEach((setState) => {
    setState(state);
  });
};

export const dispatch = <T>(action: string, args?: T) => {
  if (actionMap[action]) {
    const { store, setStates } = actionMap[action];
    const callback = store.actions[action];
    const res = callback.call(store, args);

    if (res) {
      if (res instanceof Promise) {
        res.then(() => setStatesFn(setStates, store.state));
      } else {
        const { action: ac, data } = res;
        if (data instanceof Promise) {
          data.then((val) => {
            setStatesFn(setStates, store.state);
            dispatch(ac, val);
          });
        } else {
          setStatesFn(setStates, store.state);
          dispatch(ac, data);
        }
      }
    } else {
      setStatesFn(setStates, store.state);
    }
  }
};
