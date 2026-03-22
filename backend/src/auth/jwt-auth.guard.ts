import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../common/error-messages';

export class JwtAuthGuard extends AuthGuard('jwt') {
	handleRequest(err: any, user: any, info: any) {
		if (err || !user) {
			const message = info?.message || '';
			const name = info?.name || '';

			if (name === 'TokenExpiredError') {
				throw new UnauthorizedException(ERROR_MESSAGES.AUTH.TOKEN_EXPIRED);
			}

			if (
				message.includes('No auth token') ||
				message.includes('No authorization token was found')
			) {
				throw new UnauthorizedException(ERROR_MESSAGES.AUTH.TOKEN_REQUIRED);
			}

			throw new UnauthorizedException(ERROR_MESSAGES.AUTH.TOKEN_INVALID);
		}

		return user;
	}
}