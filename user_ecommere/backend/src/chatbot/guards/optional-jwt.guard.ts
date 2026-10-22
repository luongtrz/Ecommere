import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader =
      request?.headers?.authorization ?? request?.headers?.Authorization;

    if (
      !authHeader ||
      (typeof authHeader === 'string' && authHeader.trim() === '')
    ) {
      if (request) {
        request.user = undefined;
      }
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * If a token is provided but invalid or expired, reject with 401 Unauthorized
   * rather than treating as a guest. A client that sends an invalid token expects
   * an authenticated session; silently degrading to guest mode would mask authentication
   * failures and could lead to unexpected behavior or security issues.
   */
  handleRequest(err: any, user: any, _info?: any) {
    if (err) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    }
    return user;
  }
}
