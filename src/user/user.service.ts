import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { User } from 'src/entity/user.entity';
import { UserDto } from './user.dto';
import { removeEmptyFields } from 'src/utils/utils';
import { CACHE_TTL } from 'src/utils/constants/constant';

@Injectable()
export class UserService {
  private logger: Logger = new Logger(UserService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly httpService: HttpService,
  ) {}

  toUser(userDto: UserDto) {
    const user = {
      id: userDto.id,
      email: userDto.email,
      name: userDto.name,
      workEmail: userDto.work_email,
      phone: userDto.phone,
      jobTitle: userDto.job_title,
      companyWebsite: userDto.company_website,
      companySize: userDto.company_size,
      alphaOptIn: userDto.alpha_opt_in,
      professionalDataSubmitted: userDto.professional_data_submitted,
    };
    return removeEmptyFields(user);
  }

  toUserDTO(user: User) {
    const userDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      work_email: user.workEmail,
      phone: user.phone,
      job_title: user.jobTitle,
      company_website: user.companyWebsite,
      company_size: user.companySize,
      alpha_opt_in: user.alphaOptIn,
      professional_data_submitted: user.professionalDataSubmitted,
    };
    return removeEmptyFields(userDto);
  }

  async getUserInfo(accessToken: string): Promise<any> {
    let user = await this.cacheManager.get(accessToken);
    if (user) {
      this.logger.log(`getUserInfo: User from cache: ${JSON.stringify(user)}`);
      return user;
    }
    const response = await this.httpService.axiosRef.get(
      'https://dev-grekqp1gdk7jbvov.us.auth0.com/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const userInfo = response.data;
    this.logger.log(`getUserInfo: Response data: ${JSON.stringify(userInfo)}`);
    user = {
      email: userInfo.email,
      name: userInfo.name,
    };
    await this.cacheManager.set(accessToken, user, CACHE_TTL);
    return user;
  }

  async getUserByAccessToken(accessToken: string) {
    const { email } = await this.getUserInfo(accessToken);
    const user = await this.userRepository.findOne({
      where: { email },
    });
    this.logger.log(`getUserByEmail: User: ${JSON.stringify(user)}`);
    return this.toUserDTO(user);
  }

  async validateUser(accessToken: string) {
    const userInfo = await this.getUserInfo(accessToken);
    const { email, name } = userInfo;
    let user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      user = await this.userRepository.save({ email, name });
      this.logger.log(`create: User created: ${JSON.stringify(user)}`);
    }
    return this.toUserDTO(user);
  }

  async updateUser(accessToken: string, userDto: UserDto) {
    const { email } = await this.getUserInfo(accessToken);
    const userToUpdate = await this.userRepository.findOne({
      where: { email },
    });
    if (userToUpdate.email !== userDto.email) {
      throw new HttpException('User mismatch!', HttpStatus.UNAUTHORIZED);
    }
    if (userToUpdate) {
      const user = this.toUser(userDto);
      this.logger.log(`update: User: ${JSON.stringify(user, null, 2)}`);
      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`update: User updated: ${JSON.stringify(updatedUser)}`);
      return userDto;
    } else {
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);
    }
  }
}
