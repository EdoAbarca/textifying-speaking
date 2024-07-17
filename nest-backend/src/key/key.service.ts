import { Injectable } from '@nestjs/common';
import { CreateKeyDto } from './dto/create-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Key } from './entities/key.schema';


@Injectable()
export class KeyService {
  constructor(@InjectModel('Key') private keyModel: Model<Key>) {}

  async create(createKeyDto: CreateKeyDto): Promise<Key> {
    //return this.keyModel.create(createKeyDto);
    const createdKey = new this.keyModel(createKeyDto);
    return createdKey.save();
  }

  findAll(): Promise<Key[]> {
    return this.keyModel.find().exec();
  }

  findOne(id: string): Promise<Key> {
    return this.keyModel.findById(id).exec();
  }

  async update(id: string, updateKeyDto: UpdateKeyDto): Promise<Key> {
    return this.keyModel.findByIdAndUpdate(id, updateKeyDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Key> {
    return this.keyModel.findByIdAndDelete(id).exec();
  }
}
