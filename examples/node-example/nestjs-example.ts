import { NestFactory } from '@nestjs/core'
import {
  Module,
  Injectable,
  Controller,
  Get,
  Post,
  Body,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common'
import { FedimintWallet, FedimintWalletEnv } from '@fedimint/core-web'

// Service that manages the Fedimint wallet
@Injectable()
export class FedimintService implements OnModuleInit, OnModuleDestroy {
  private wallet: FedimintWallet

  constructor() {
    // createWallet automatically chooses FedimintWallet in server environments
    this.wallet = new FedimintWallet(FedimintWalletEnv.Server)
  }

  // Initialize wallet when the module starts
  async onModuleInit() {
    // Make sure to set this in your environment variables
    const inviteCode = process.env.FEDIMINT_INVITE_CODE
    if (!inviteCode) {
      throw new Error('FEDIMINT_INVITE_CODE environment variable is required')
    }

    try {
      const joined = await this.wallet.joinFederation(inviteCode)
      if (!joined) {
        throw new Error('Failed to join federation')
      }
      console.log('Fedimint wallet initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Fedimint wallet:', error)
      throw error
    }
  }

  // Clean up wallet when the module is destroyed
  async onModuleDestroy() {
    await this.wallet.cleanup()
    console.log('Fedimint wallet cleaned up')
  }

  // Get wallet balance
  async getBalance(): Promise<number> {
    return this.wallet.balance.getBalance()
  }

  // Create a Lightning invoice
  async createInvoice(
    amountMsat: number,
    description: string,
  ): Promise<string> {
    const result = await this.wallet.lightning.createInvoice(
      amountMsat,
      description,
    )
    return result.bolt11
  }

  // Pay a Lightning invoice
  async payInvoice(bolt11: string): Promise<any> {
    return this.wallet.lightning.payInvoice(bolt11)
  }

  // Get federation ID
  async getFederationId(): Promise<string> {
    return this.wallet.federation.getFederationId()
  }
}

// Controller that exposes Fedimint functionality via API endpoints
@Controller('api/fedimint')
export class FedimintController {
  constructor(private fedimintService: FedimintService) {}

  @Get('balance')
  async getBalance() {
    const balance = await this.fedimintService.getBalance()
    return { balance }
  }

  @Get('federation')
  async getFederationInfo() {
    const federationId = await this.fedimintService.getFederationId()
    return { federationId }
  }

  @Post('invoice')
  async createInvoice(@Body() body: { amount: number; description: string }) {
    const { amount, description } = body
    const bolt11 = await this.fedimintService.createInvoice(
      amount,
      description || 'Payment',
    )
    return { bolt11 }
  }

  @Post('pay')
  async payInvoice(@Body() body: { bolt11: string }) {
    const { bolt11 } = body
    const result = await this.fedimintService.payInvoice(bolt11)
    return { success: true, result }
  }
}

// Module that combines the service and controller
@Module({
  providers: [FedimintService],
  controllers: [FedimintController],
  exports: [FedimintService],
})
export class FedimintModule {}

// Main application module
@Module({
  imports: [FedimintModule],
})
export class AppModule {}

// Bootstrap the application
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3000)
  console.log('NestJS application is running on port 3000')
}

// Only run bootstrap if this file is executed directly
if (require.main === module) {
  bootstrap()
}
