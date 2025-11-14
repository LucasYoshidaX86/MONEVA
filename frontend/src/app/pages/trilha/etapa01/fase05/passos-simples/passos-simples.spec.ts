import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassosSimples } from './passos-simples';

describe('PassosSimples', () => {
  let component: PassosSimples;
  let fixture: ComponentFixture<PassosSimples>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassosSimples]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassosSimples);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
