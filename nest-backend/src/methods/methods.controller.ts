import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MethodsService } from './methods.service';


@Controller('methods')
export class MethodsController {
  constructor(private readonly methodsService: MethodsService) {}


}
