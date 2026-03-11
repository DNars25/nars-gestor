import { PrismaClient } from '../src/generated/prisma'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Criar Admin Geral
  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } })

  if (!adminExists) {
    const passwordHash = await argon2.hash('Admin@2024Secure!')
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@nars.local',
        passwordHash,
        role: 'ADMIN',
        status: 'ATIVO',
        credits: 999999,
      },
    })
    console.log('✅ Admin criado: admin / Admin@2024Secure!')
  } else {
    console.log('ℹ️  Admin já existe')
  }

  // Configurações padrão do sistema
  const defaultConfigs = [
    { key: 'server_dns', value: '149.248.46.167' },
    { key: 'server_international_dns', value: '' },
    { key: 'smarters_url', value: '' },
    { key: 'smarters_code', value: '' },
    { key: 'telegram_channel', value: '' },
    { key: 'expiring_alert_days', value: '7' },
    { key: 'trial_duration_hours', value: '24' },
    { key: 'system_rules', value: '' },
    { key: 'commercial_rules', value: '' },
    {
      key: 'price_table',
      value: JSON.stringify([
        { type: 'IPTV', package: 'Mensal', price: 25, category: 'CLIENTE' },
        { type: 'IPTV', package: 'Trimestral', price: 65, category: 'CLIENTE' },
        { type: 'IPTV', package: 'Semestral', price: 120, category: 'CLIENTE' },
        { type: 'IPTV', package: 'Anual', price: 200, category: 'CLIENTE' },
      ]),
    },
  ]

  for (const config of defaultConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }

  console.log('✅ Configurações padrão criadas')
  console.log('\n🚀 Seed completo! Acesse: http://localhost:3000/login')
  console.log('   Usuário: admin')
  console.log('   Senha:   Admin@2024Secure!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
