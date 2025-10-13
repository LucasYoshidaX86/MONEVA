import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaibaMais } from './saiba-mais';

describe('SaibaMais', () => {
  let component: SaibaMais;
  let fixture: ComponentFixture<SaibaMais>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaibaMais]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaibaMais);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
