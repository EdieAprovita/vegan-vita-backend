import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'vegan-vita-super-secret-key',
    });
  }

  async validate(payload: { id: string; email: string }): Promise<User> {
    const user = await this.authService.validateUser(payload.id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    return user;
  }
}
