import {warriors} from "./realWarriors.js";
import {findSpecial} from "./specials.js";
import {getElement, NO_ELE} from "./elements.js";
import {Stat} from "./stat.js";
import {Lead} from "./leaderSkill.js";
import {OnUpdateAction} from "../actions/onUpdateAction.js";
import {OnHitAction} from "../actions/onHitAction.js";
import {HitEvent} from "../actions/hitEvent.js";

// The base values for both stats, might change them later
const OFFENSE = 33.73;
const HP = 107.0149;

export class Warrior{
    //better way to do this?
    constructor(name){
	    /*
	    The warrior Class takes data from an array:
	    new Warrior([name, [off, ele, hp, arm, pip], element, special, leader_skill]);
	    */
	    let data = this.find_warrior(name);
	    this.name = data[0];
        this.stats = new Map();
        
	    let baseOff = OFFENSE * data[1][0];
        
        this.stats.set(Stat.PHYS, new Stat(Stat.PHYS, baseOff * (1 - data[1][1]), true));
        this.stats.set(Stat.ELE, new Stat(Stat.ELE, baseOff * data[1][1], true));
        this.stats.set(Stat.ARM, new Stat(Stat.ARM, data[1][3]));
        this.stats.set(Stat.HP, new Stat(Stat.HP, HP * data[1][2], true));
        
	    this.pip = data[1][4];
	    this.element = getElement(data[2]);
	    this.special = findSpecial(data[3]);
	    this.lead_skill = new Lead(data[4][0], data[4][1]);
	    this.level = 34;
	    
        this.warriorSkills = [];
        
	    this.special.setUser(this);
    }
    
    
    
    
    
    
    
    // new attack stuff
    //hunter will apply here
    calcDamage(phys, ele, attack){
        phys *= (1 - this.getStat(Stat.ARM) * 0.12);
        if (this.element.weakness === attack.user.element.name){
			ele *= 1.7;
		} else if (this.element.name === attack.user.element.weakness){
			ele *= 0.3;
		}
        return phys + ele;
    }
    newStrike(using, target=undefined, phys=undefined, ele=undefined){
        if(target === undefined){
            target = this.user.enemyTeam.active;
        }
        if(phys === undefined){
            phys = using.getPhysicalDamage();
        }
        if(ele === undefined){
            ele = using.getElementalDamage();
        }
        let dmg = target.calcDamage(phys, ele, using);
        let event = new HitEvent(this, target, using, dmg);
        this.onHitActions.forEach((v, k)=>{
            console.log(k);
            console.log(v);
            if(v.applyBeforeHit){
                v.run(event);
            }
        });
        target.onHitActions.forEach((v, k)=>{
            if(v.applyBeforeHit){
                v.run(event);
            }
        });
        
        target.takeDamage(dmg);
        if(target.team.active === target){
            target.team.gainEnergy();
        }
        
        this.onHitActions.forEach((v, k)=>{
            if(!v.applyBeforeHit){
                v.run(event);
            }
        });
        target.onHitActions.forEach((v, k)=>{
            if(!v.applyBeforeHit){
                v.run(event);
            }
        });
        target.last_hitby = this;
        return event.dmg; //for Soul Steal
    }
    takeDamage(amount){
        //this.last_phys_dmg += ?;
        //this.last_ele_dmg += ?;
        this.lastDmg += amount;
        this.hp_rem -= amount;
        this.hp_rem = Math.round(this.hp_rem);
    }
    
    
    
    calc_damage_taken(phys, ele){
		var physical_damage = phys * this.get_armor();
		var elemental_damage = ele;
		
		if (this.element.weakness === this.team.enemyTeam.active.element.name){
			elemental_damage *= 1.7;
		}
		
		else if (this.element.name === this.team.enemyTeam.active.element.weakness){
			elemental_damage *= 0.3;
		}
		
		this.take_damage(physical_damage, elemental_damage);
		this.last_hitby = this.team.enemyTeam.active;
		return physical_damage + elemental_damage;
	}
	
    //shell here
    take_damage(phys, ele){
        /*
        Lose HP equal to the damage you took
        If you survive, you can heal some of it off
        */
		var dmg = phys + ele;
		this.hp_rem -= dmg;
		this.last_phys_dmg += phys;
		this.last_ele_dmg += ele;
		
		this.hp_rem = Math.round(this.hp_rem);
		
        /*
		if(this.skills[0] === "shell"){
		    if(this.hp_perc() <= 0.5){
		        this.in_shell = true;
		    }
		}
        */
	}
    
    //shell here
	heal(hp){
        /*
        Restore HP
        Prevents from healing past full
        Also rounds for you
        */
		this.last_healed += Math.round(hp);
		this.hp_rem += hp;
		if (this.hp_rem > this.getStat(Stat.HP)){
			this.hp_rem = this.getStat(Stat.HP);
		}
		this.hp_rem = Math.round(this.hp_rem);
        /*
		if(this.skills[0] === "shell"){
		    if(this.hp_perc() > 0.5){
		        this.in_shell = false;
		    }
		}*/
	}
    
	pass(){}
	
    //guard, critical hit here
	use_normal_move(){
        /*
        Strike at your enemy team's active warrior with your sword!
        */
	    var mod = 1.0;
        /*
	    if(this.skills[0] === "critical hit"){
	        if(Math.random() <= 0.24){
	            console.log("Critical hit!");
	            mod += 0.24;
	        }
	    }*/
        /*
	    if(this.team.enemyTeam.active.skills[0] === "guard"){
	        if(Math.random() <= 0.24){
	            console.log("Guard!");
	            mod -= 0.24;
	        }
	    }*/
		//use normal move
	}
    
	use_special(){
		/*
		Use your powerful Special Move!
		*/
		this.team.switchback = this.team.active;
		this.team.switchin(this);
		this.special.attack();
		this.team.energy -= 2;
	}
    
    
    
    
    
    
    //change this to look in the player's warriors
    find_warrior(name){
    	for(let warrior of warriors){
    		if(warrior[0] === name){
    			return warrior;
    		}
    	}
    	return ["ERROR", [1, 0.5, 1, 1, 2], "none", "ERROR", [5, "p"]];
    }
    
    addSkill(warriorSkill){
        this.warriorSkills.push(warriorSkill);
        warriorSkill.setUser(this);
    }
    
	calcStats(){
		/*
		Calculate a warrior's stats
		Increases by 7% per level
		*/
        //values is a generator, not an array
        for(let stat of this.stats.values()){
            stat.calc(this.level);
        }
	}
    
    getBase(statEnum){
        return this.stats.get(statEnum).getBase();
    }
    
    getStat(statEnum){
        return this.stats.get(statEnum).getValue();
    }
    
    applyBoost(statEnum, boost){
        if(this.stats.has(statEnum)){
            this.stats.get(statEnum).applyBoost(boost);
        } else {
            console.log("Stat not found: " + statEnum);
        }
    }
	
	hp_perc(){
	    /*
	    Returns the percentage of your HP remaining
	    AS A VALUE BETWEEN 0 AND 1
	    NOT 0 AND 100
	    */
		return this.hp_rem / this.getStat(Stat.HP);
	}
	perc_hp(perc){
	    /*
	    Returns how much of your max HP will equal perc
		Example:
			With 200 HP, this.perc_hp(0.5) will return 100
	    */
		return this.getStat(Stat.HP) * (perc);
    }
	
    check_if_ko(){
        /*
        An I dead yet?
        */
		return this.hp_rem <= 0;
	}
	
    addOnHitAction(action){
        this.onHitActions.set(action.id, action);
        action.setUser(this);
    }
    
    addOnUpdateAction(action){
        this.onUpdateActions.set(action.id, action);
    }
	
	update(){
        this.check_durations();
		this.poisoned = false;
		this.regen = false;
		
		if(this.in_shell){
            this.applyBoost(Stat.ARM, new Stat_boost("shell", 3, 1));
		}
		
		let new_update = new Map();
		for(let a of this.onUpdateActions.values()){
		    a.run();
		    if(!a.should_terminate){
		        new_update.set(a.id, a);
		    }
		}
		this.onUpdateActions = new_update;
	}
	
	// make this stuff better
	init(){
		this.calcStats();
		this.hp_rem = this.getStat(Stat.HP);
        
		this.poisoned = false;
		this.regen = false;
		this.shield = false;
		
		this.last_phys_dmg = 0;
		this.last_ele_dmg = 0;
		this.last_hitby = undefined;
		this.last_healed = 0;
		
		this.in_shell = false;
		
        this.onUpdateActions = new Map();
        this.onHitActions = new Map();
        
        this.warriorSkills.forEach((skill)=>{
            skill.apply();
        });
	}
    
	// update this once Resilience out
	nat_regen(){
		let x = this;
		this.heal((x.last_phys_dmg + x.last_ele_dmg) * 0.4);
	}
	reset_dmg(){
	    /*
	    Reset your most recent damage to 0
	    DOES NOT HEAL YOU
	    Used for heart collection
	    */
		this.last_phys_dmg = 0;
		this.last_ele_dmg = 0;
	}
	reset_heal(){
	    this.last_healed = 0;
	}
	
	check_durations(){
	    /*
	    Check to see how long each of your boosts has left
	    Then push whatever ones are left to a new array
	    Your boosts become the new array
	    */
       
        this.stats.forEach((stat)=>{
            stat.update();
        });
		
        this.boost_up = false;
        for(let boost of this.stats.get(Stat.ELE).boosts.values()){
            if(boost.id === this.element.name + " Boost"){
                this.boost_up = true;
                break;
            }
        }
        
		this.shield = false;
        for(let boost of this.stats.get(Stat.ARM).boosts.values()){
            if(boost.id === "Phantom Shield"){
                this.shield = true;
                break;
            }
        }
	}

    poison(amount){
        this.addOnUpdateAction(new OnUpdateAction(
            "poison",
            ()=>{
                this.poisoned = true;
                this.take_damage(amount, 0);
            }, 3
        ));
    }
}

export class Stat_boost{
    constructor(id, amount, dur){
        this.id = id;
        this.amount = amount;
        this.max_dur = dur;
        this.dur_rem = dur;
        this.should_terminate = false;
    }
    update(){
        this.dur_rem -= 1;
        if(this.dur_rem <= 0){
            this.should_terminate = true;
        }
    }
}