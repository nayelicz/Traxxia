#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, BytesN, Env, String};

#[contracttype]
#[derive(Clone)]
pub enum Key { Admin, Oracle, PaymentToken, Property(String), Valuation(String) }

#[contracttype]
#[derive(Clone)]
pub struct Property { pub seller: Address, pub owner: Address, pub price: i128, pub state: u32, pub reserved_by: Address }

#[contracttype]
#[derive(Clone)]
pub struct Valuation { pub hash: BytesN<32>, pub score: u32, pub confidence: u32, pub published_at: u64 }

#[contract]
pub struct Registry;

#[contractimpl]
impl Registry {
    pub fn initialize(env: Env, admin: Address, oracle: Address, payment_token: Address) {
        if env.storage().instance().has(&Key::Admin) { panic!("already initialized") }
        admin.require_auth();
        env.storage().instance().set(&Key::Admin, &admin);
        env.storage().instance().set(&Key::Oracle, &oracle);
        env.storage().instance().set(&Key::PaymentToken, &payment_token);
    }
    pub fn list(env: Env, id: String, seller: Address, price: i128) {
        let admin: Address = env.storage().instance().get(&Key::Admin).expect("not initialized");
        admin.require_auth(); seller.require_auth();
        if price <= 0 || env.storage().persistent().has(&Key::Property(id.clone())) { panic!("invalid listing") }
        let record = Property { seller: seller.clone(), owner: seller.clone(), price, state: 0, reserved_by: seller };
        env.storage().persistent().set(&Key::Property(id), &record);
    }
    pub fn publish(env: Env, id: String, hash: BytesN<32>, score: u32, confidence: u32) {
        let oracle: Address = env.storage().instance().get(&Key::Oracle).expect("not initialized");
        oracle.require_auth();
        if !env.storage().persistent().has(&Key::Property(id.clone())) || score > 100 || confidence > 100 { panic!("invalid valuation") }
        env.storage().persistent().set(&Key::Valuation(id), &Valuation { hash, score, confidence, published_at: env.ledger().timestamp() });
    }
    pub fn reserve(env: Env, id: String, buyer: Address) {
        buyer.require_auth();
        let mut p: Property = env.storage().persistent().get(&Key::Property(id.clone())).expect("unknown property");
        if p.state != 0 || p.seller == buyer { panic!("unavailable") }
        p.reserved_by = buyer;
        p.state = 1;
        env.storage().persistent().set(&Key::Property(id), &p);
    }
    pub fn purchase(env: Env, id: String, buyer: Address) {
        buyer.require_auth();
        let mut p: Property = env.storage().persistent().get(&Key::Property(id.clone())).expect("unknown property");
        if p.state != 1 || p.reserved_by != buyer { panic!("not reserved by buyer") }
        let valuation: Valuation = env.storage().persistent().get(&Key::Valuation(id.clone())).expect("valuation required");
        if valuation.score < 80 || valuation.confidence < 75 || env.ledger().timestamp().saturating_sub(valuation.published_at) > 86400 { panic!("valuation rule failed") }
        let token_id: Address = env.storage().instance().get(&Key::PaymentToken).expect("not initialized");
        token::Client::new(&env, &token_id).transfer(&buyer, &p.seller, &p.price);
        p.owner = buyer;
        p.state = 2;
        env.storage().persistent().set(&Key::Property(id), &p);
    }
    pub fn property(env: Env, id: String) -> Property { env.storage().persistent().get(&Key::Property(id)).expect("unknown property") }
    pub fn valuation(env: Env, id: String) -> Valuation { env.storage().persistent().get(&Key::Valuation(id)).expect("no valuation") }
}
