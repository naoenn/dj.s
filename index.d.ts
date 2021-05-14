declare global {
  import React from 'react';
}

export = ydj;

export as namespace ydj;

declare namespace ydj {
  /**
   * dispatchメソッド
   */
  declare type Dispatch = <T>(action: string, arg: T) => void;
  /**
   * useStoreメソッド
   */
  declare function useStore<T>(
    storeClass: typeof IStore | IStore<T>,
    init: T
  ): [T, Dispatch];

  /**
   * Storeクラス
   */
  declare class IStore<T> {
    state: T | null;
    initialized: boolean;
    /**
     * 初期処理
     */
    init?(): void;
    /**
     * actionに対するコールバックを定義
     */
    actions: {
      [action: string]: ydj.StoreCallback;
    };
  }

  /**
   * action callback
   */
  declare type StoreCallback = (
    arg: any
  ) => void | [action: string, data: any | Promise<any | void>] | Promise<void>;
}

/**
 * action map
 */
export interface ActionMap {
  [action: string]: {
    store: IStore<T>;
    setState: React.Dispatch<React.SetStateAction<T>>;
  };
}
