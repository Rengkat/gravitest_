import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PassagesService } from './passages.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';
import {
  CreatePassageDto,
  PassageFiltersDto,
  UpdatePassageDto,
} from './dto/passage.dto';

@ApiTags('Passages')
@ApiBearerAuth()
@Controller('passages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class PassagesController {
  constructor(private readonly passagesService: PassagesService) {}

  @Post()
  create(@Body() dto: CreatePassageDto) {
    return this.passagesService.create(dto);
  }

  @Get()
  findAll(@Query() filters: PassageFiltersDto) {
    return this.passagesService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.passagesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePassageDto,
  ) {
    return this.passagesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.passagesService.remove(id);
  }
}
