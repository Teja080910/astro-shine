import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { AstrologersModule } from './modules/astrologers/astrologers.module';
import { AdminsModule } from './modules/admin/admins.module';
import { KundliModule } from './modules/kundli/kundli.module';
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module';
import { HoroscopeModule } from './modules/horoscope/horoscope.module';
import { PanchangModule } from './modules/panchang/panchang.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { WithdrawalModule } from './modules/withdrawal/withdrawal.module';
import { CommissionModule } from './modules/commission/commission.module';
import { CallsModule } from './modules/calls/calls.module';
import { ChatModule } from './modules/chat/chat.module';
import { GiftsModule } from './modules/gifts/gifts.module';
import { DonationsModule } from './modules/donations/donations.module';
import { ShopModule } from './modules/shop/shop.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { NewsModule } from './modules/news/news.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { DynamicLinksModule } from './modules/dynamic-links/dynamic-links.module';
import { WebsiteContentModule } from './modules/website-content/website-content.module';
import { LiveSessionsModule } from './modules/live-sessions/live-sessions.module';
import { MandirPoojaModule } from './modules/mandir-pooja/mandir-pooja.module';
import { SupportTicketsModule } from './modules/support-tickets/support-tickets.module';
import { AppReleasesModule } from './modules/app-releases/app-releases.module';
import { VideosModule } from './modules/videos/videos.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    WalletModule,
    AstrologersModule,
    AdminsModule,
    KundliModule,
    MatchmakingModule,
    HoroscopeModule,
    PanchangModule,
    TransactionsModule,
    WithdrawalModule,
    CommissionModule,
    CallsModule,
    ChatModule,
    GiftsModule,
    DonationsModule,
    ShopModule,
    OrdersModule,
    BlogsModule,
    NewsModule,
    ReviewsModule,
    ReportsModule,
    NotificationsModule,
    SettingsModule,
    ApiKeysModule,
    DynamicLinksModule,
    WebsiteContentModule,
    LiveSessionsModule,
    MandirPoojaModule,
    SupportTicketsModule,
    AppReleasesModule,
    VideosModule,
    FileUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
