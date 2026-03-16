import { NextFunction, Request, Response } from 'express';
import { IUserDocument } from '../../apps/users/interface/User';

export interface IRequest extends Request {
    user?: IUserDocument;
    file?: Express.Multer.File | undefined;
}

export interface IResponse extends Response { }

export interface INextFunction extends NextFunction { }


export interface ControllerMethod {
    (req: IRequest, res: IResponse, next: INextFunction): Promise<void>;
}

export interface IMiddlewareFunction {
    (req: IRequest, res: IResponse, next: INextFunction): void | Promise<void>;
}

export interface RouteConfig {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    handler: ControllerMethod;
    middleware?: IMiddlewareFunction[];
    validation?: any;
} 