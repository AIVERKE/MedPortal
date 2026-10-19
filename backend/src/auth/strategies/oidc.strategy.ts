import {
  Injectable,
  UnauthorizedException,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport';
import * as oidc from 'openid-client';
import { AuthService } from '../auth.service';

// Estrategia vacía de fallback para cuando OIDC no está configurado
class NoopStrategy extends Strategy {
  constructor() {
    super();
    this.name = 'oidc';
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  authenticate(_req: any, _options?: any) {
    this.fail({ message: 'OIDC no está configurado en este servidor.' });
  }
}

@Injectable()
export class OidcStrategy {
  private readonly logger = new Logger(OidcStrategy.name);
  private strategy: Strategy;

  constructor(
    private readonly authService: AuthService,
    @Optional() @Inject('OIDC_CLIENT') private client: oidc.Client | null,
  ) {
    if (!client) {
      this.logger.warn(
        'Cliente OIDC no disponible. La autenticación OIDC está deshabilitada.',
      );
      this.strategy = new NoopStrategy();
    } else {
      const nonNullClient: oidc.Client = client;
      const oidcPassportStrategy = PassportStrategy(oidc.Strategy, 'oidc');
      const self = this;

      class ConcreteOidcStrategy extends oidcPassportStrategy {
        constructor() {
          super({
            client: nonNullClient,
            params: {
              redirect_uri: process.env.OIDC_REDIRECT_URI,
              scope: 'openid profile email',
            },
            usePKCE: true,
          });
        }

        async validate(tokenset: oidc.TokenSet): Promise<any> {
          return self.validate(tokenset);
        }
      }

      this.strategy = new ConcreteOidcStrategy();
    }
  }

  async validate(tokenset: oidc.TokenSet): Promise<any> {
    const userinfo = await this.validateTokenset(tokenset);

    if (!userinfo) {
      throw new UnauthorizedException(
        'No se pudo obtener información del usuario',
      );
    }

    const user = await this.authService.validateOidcUser(userinfo);

    if (!user) {
      throw new UnauthorizedException('Usuario no autorizado en este sistema');
    }

    return user;
  }

  private async validateTokenset(tokenset: oidc.TokenSet): Promise<any> {
    try {
      return await this.client!.userinfo(tokenset);
    } catch (err) {
      return null;
    }
  }
}
