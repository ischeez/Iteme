import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        'xyuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu.<3.this.all.yslishal',
    });
  }
  validate(payload: { sub: string; role: Role; telegramId: string }) {
    return {
      userId: payload.sub,
      role: payload.role,
      telegramId: payload.telegramId,
    };
  }
}
